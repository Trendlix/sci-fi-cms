import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import BasicRichEditor from "@/components/tiptap/BasicRichEditor";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventUpcomingStore } from "@/shared/hooks/store/events/useEventUpcomingStore";
import type { EventUpcomingPayload } from "@/shared/hooks/store/events/events.types";
import { Upload, X } from "lucide-react";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox";

const fileSchema = z.any().refine((file) => !file || file instanceof File, {
    message: "Image must be a file",
});

const highlightItemSchema = z.object({
    value: z.string().min(1, "Highlight is required"),
});

const upcomingCardSchema = z.object({
    fileFile: fileSchema.optional(),
    type: z.string().min(1, "Type is required"),
    tag: z.string().min(1, "Tag is required"),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description is required"),
    cta: z.string().min(1, "CTA is required"),
    highlights: z.array(highlightItemSchema).min(1).max(3),
});

export const EventUpcomingZodSchema = z.object({
    cards: z.array(upcomingCardSchema).min(1),
});

type EventUpcomingFormValues = z.infer<typeof EventUpcomingZodSchema>;

const defaultHighlights = () => [{ value: "" }];

const buildEmptyCard = () => ({
    fileFile: undefined,
    type: "",
    tag: "",
    title: "",
    description: "",
    cta: "",
    highlights: defaultHighlights(),
});

const defaultValues: EventUpcomingFormValues = {
    cards: [buildEmptyCard()],
};

type FileUploaderProps = {
    control: ReturnType<typeof useForm<EventUpcomingFormValues>>["control"];
    name: `cards.${number}.fileFile`;
    inputId: string;
    existingUrl?: string;
};

const FileUploader = ({ control, name, inputId, existingUrl }: FileUploaderProps) => {
    const file = useWatch({ control, name });
    const objectUrl = useMemo(() => {
        if (file instanceof File) {
            return URL.createObjectURL(file);
        }
        return null;
    }, [file]);

    useEffect(() => {
        if (!objectUrl) {
            return undefined;
        }
        return () => URL.revokeObjectURL(objectUrl);
    }, [objectUrl]);

    const previewUrl = objectUrl ?? existingUrl ?? null;

    return (
        <Controller
            control={control}
            name={name}
            render={({ field: controllerField }) => (
                <div className="flex items-center gap-4">
                    <label
                        htmlFor={inputId}
                        className="relative flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-white/30 bg-white/5 text-xs text-white/70 transition hover:bg-white/10"
                    >
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Upcoming file preview"
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        ) : (
                            <>
                                <Upload size={18} className="text-white/70" />
                                <span className="text-center">Upload image</span>
                            </>
                        )}
                    </label>
                    <span className="text-xs text-white/60">
                        {controllerField.value instanceof File
                            ? controllerField.value.name
                            : existingUrl
                                ? "Current image"
                                : "PNG, JPG up to 5MB"}
                    </span>
                    <input
                        id={inputId}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                            const selectedFile = event.target.files?.[0];
                            controllerField.onChange(selectedFile ?? undefined);
                        }}
                    />
                </div>
            )}
        />
    );
};

type HighlightsListProps = {
    cardIndex: number;
};

const HighlightsList = ({ cardIndex }: HighlightsListProps) => {
    const { control, register, formState } = useFormContext<EventUpcomingFormValues>();
    const highlightsFieldArray = useFieldArray({
        control,
        name: `cards.${cardIndex}.highlights`,
    });

    return (
        <div className="space-y-3">
            {highlightsFieldArray.fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-3">
                    <div className="flex-1">
                        <Input
                            placeholder={`Highlight ${index + 1}`}
                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                            {...register(`cards.${cardIndex}.highlights.${index}.value`)}
                        />
                        <FieldError errors={[formState.errors.cards?.[cardIndex]?.highlights?.[index]?.value]} />
                    </div>
                    <Button
                        type="button"
                        className="bg-white/10 text-white hover:bg-white/20"
                        disabled={highlightsFieldArray.fields.length <= 1}
                        onClick={() => highlightsFieldArray.remove(index)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                className="bg-white/10 text-white hover:bg-white/20"
                disabled={highlightsFieldArray.fields.length >= 3}
                onClick={() => highlightsFieldArray.append({ value: "" })}
            >
                Add highlight
            </Button>
        </div>
    );
};

const EventsUpcoming = () => {
    const { types, get, getTypes, update, getLoading, updateLoading, typesLoading } = useEventUpcomingStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const typeOptions = types?.[language] ?? [];
    const [currentData, setCurrentData] = useState<EventUpcomingPayload | null>(null);
    const upcomingForm = useForm<EventUpcomingFormValues>({
        defaultValues,
        resolver: zodResolver(EventUpcomingZodSchema),
        mode: "onChange",
    });

    const cardsValue = useWatch({ control: upcomingForm.control, name: "cards" });

    const cardFields = useFieldArray({
        control: upcomingForm.control,
        name: "cards",
    });

    useEffect(() => {
        let isActive = true;
        const load = async () => {
            setCurrentData(null);
            upcomingForm.reset(defaultValues);
            upcomingForm.clearErrors();
            const result = await get().catch(() => null);
            if (!isActive) return;
            if (!result) {
                upcomingForm.reset(defaultValues);
                setCurrentData(null);
                return;
            }
            setCurrentData(result);
            upcomingForm.reset({
                cards: result.length
                    ? result.map((card) => ({
                        fileFile: undefined,
                        type: card.type ?? "",
                        tag: card.tag ?? "",
                        title: card.title ?? "",
                        description: card.description ?? "",
                        cta: card.cta ?? "",
                        highlights: card.highlights?.length
                            ? card.highlights.map((value) => ({ value }))
                            : defaultHighlights(),
                    }))
                    : defaultValues.cards,
            });
        };

        void load();
        void getTypes();
        return () => {
            isActive = false;
        };
    }, [get, getTypes, language, upcomingForm]);

    const toList = (items: { value: string }[]) => items.map((item) => item.value.trim()).filter(Boolean);
    const buildTypeOptions = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) {
            return typeOptions;
        }
        return typeOptions.includes(trimmed) ? typeOptions : [trimmed, ...typeOptions];
    };

    const onSubmit = async (formData: EventUpcomingFormValues) => {
        await update({
            cards: formData.cards.map((card) => ({
                type: card.type.trim(),
                fileFile: card.fileFile,
                tag: card.tag,
                title: card.title,
                description: card.description,
                cta: card.cta,
                highlights: toList(card.highlights),
            })),
        });
    };

    if (getLoading) {
        return (
            <div className={cn("space-y-4", isRtl && "home-rtl")}>
                <CommonLanguageSwitcherCheckbox />
                <div className="space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-24 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <FormProvider {...upcomingForm}>
            <form onSubmit={upcomingForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                <CommonLanguageSwitcherCheckbox />
                <div className="space-y-1 text-white">
                    <h1 className="text-2xl font-semibold text-white">Events Upcoming</h1>
                    <p className="text-sm text-white/70">Add upcoming event details</p>
                </div>
                <div className="space-y-6">
                    {cardFields.fields.map((field, index) => {
                        const currentTypeValue = cardsValue?.[index]?.type ?? "";
                        const mergedTypes = buildTypeOptions(currentTypeValue);
                        const descriptionValue = cardsValue?.[index]?.description ?? "";

                        return (
                            <div key={field.id} className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-white">Card {index + 1}</h2>
                                    <Button
                                        type="button"
                                        className="bg-white/10 text-white hover:bg-white/20"
                                        disabled={cardFields.fields.length <= 1}
                                        onClick={() => cardFields.remove(index)}
                                    >
                                        Remove card
                                    </Button>
                                </div>
                                <Field>
                                    <FieldLabel className="text-white/80">
                                        File <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <FileUploader
                                            control={upcomingForm.control}
                                            name={`cards.${index}.fileFile`}
                                            inputId={`events-upcoming-file-${index}`}
                                            existingUrl={currentData?.[index]?.file?.url}
                                        />
                                        <FieldError errors={[upcomingForm.formState.errors.cards?.[index]?.fileFile]} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor={`events-upcoming-type-${index}`} className="text-white/80">
                                        Type <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            control={upcomingForm.control}
                                            name={`cards.${index}.type`}
                                            render={({ field: controllerField }) => (
                                                <Combobox
                                                    items={mergedTypes}
                                                    value={controllerField.value || ""}
                                                    onValueChange={(value) => controllerField.onChange(value ?? "")}
                                                    onInputValueChange={(value) => controllerField.onChange(value)}
                                                >
                                                    <ComboboxInput
                                                        id={`events-upcoming-type-${index}`}
                                                        placeholder={typesLoading ? "Loading types..." : "Select or type a type"}
                                                        showClear
                                                        disabled={typesLoading}
                                                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40 rounded-xl"
                                                    />
                                                    <ComboboxContent className="border border-white/15 bg-black/80 text-white backdrop-blur-sm">
                                                        <ComboboxEmpty className="text-white/60">No types found.</ComboboxEmpty>
                                                        <ComboboxList>
                                                            {(item) => (
                                                                <ComboboxItem
                                                                    key={item}
                                                                    value={item}
                                                                    className="data-highlighted:bg-white/10 data-highlighted:text-white"
                                                                >
                                                                    {item}
                                                                </ComboboxItem>
                                                            )}
                                                        </ComboboxList>
                                                    </ComboboxContent>
                                                </Combobox>
                                            )}
                                        />
                                        <FieldError errors={[upcomingForm.formState.errors.cards?.[index]?.type]} />
                                    </FieldContent>
                                </Field>
                                <FieldGroup className="grid gap-4 md:grid-cols-2">
                                    <Field>
                                        <FieldLabel htmlFor={`events-upcoming-tag-${index}`} className="text-white/80">
                                            Tag <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`events-upcoming-tag-${index}`}
                                                placeholder="Enter tag"
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...upcomingForm.register(`cards.${index}.tag`)}
                                            />
                                            <FieldError errors={[upcomingForm.formState.errors.cards?.[index]?.tag]} />
                                        </FieldContent>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor={`events-upcoming-title-${index}`} className="text-white/80">
                                            Title <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`events-upcoming-title-${index}`}
                                                placeholder="Enter title"
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...upcomingForm.register(`cards.${index}.title`)}
                                            />
                                            <FieldError errors={[upcomingForm.formState.errors.cards?.[index]?.title]} />
                                        </FieldContent>
                                    </Field>
                                </FieldGroup>
                                <Field>
                                    <FieldLabel className="text-white/80">
                                        Description <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <BasicRichEditor
                                            name={`cards.${index}.description`}
                                            value={descriptionValue ?? ""}
                                        />
                                        <FieldError errors={[upcomingForm.formState.errors.cards?.[index]?.description]} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor={`events-upcoming-cta-${index}`} className="text-white/80">
                                        CTA <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`events-upcoming-cta-${index}`}
                                            placeholder="Enter CTA"
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...upcomingForm.register(`cards.${index}.cta`)}
                                        />
                                        <FieldError errors={[upcomingForm.formState.errors.cards?.[index]?.cta]} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel className="text-white/80">Highlights</FieldLabel>
                                    <FieldContent>
                                        <HighlightsList cardIndex={index} />
                                    </FieldContent>
                                </Field>
                            </div>
                        );
                    })}
                    <Button
                        type="button"
                        className="bg-white/10 text-white hover:bg-white/20"
                        onClick={() => cardFields.append(buildEmptyCard())}
                    >
                        Add card
                    </Button>
                </div>
                <Button
                    type="submit"
                    className="w-full bg-white/90 text-black hover:bg-white"
                    disabled={getLoading || updateLoading || !upcomingForm.formState.isValid}
                >
                    {updateLoading ? "Saving..." : "Save"}
                </Button>
            </form>
        </FormProvider>
    );
};

export default EventsUpcoming;

