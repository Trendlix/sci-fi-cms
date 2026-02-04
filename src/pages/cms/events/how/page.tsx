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
import { useEventHowStore } from "@/shared/hooks/store/events/useEventHowStore";
import type { EventHowPayload } from "@/shared/hooks/store/events/events.types";
import { Upload, X } from "lucide-react";

const fileSchema = z.any().refine((file) => !file || file instanceof File, {
    message: "Image must be a file",
});

const highlightItemSchema = z.object({
    value: z.string().min(1, "Highlight is required"),
});

const eventHowCardSchema = z.object({
    fileFile: fileSchema.optional(),
    icon: z.string().min(1, "Icon is required"),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description is required"),
    highlights: z.array(highlightItemSchema).min(1).max(4),
});

export const EventHowZodSchema = z.object({
    description: z.string().min(10, "Description is required"),
    cards: z.array(eventHowCardSchema).min(1),
});

type EventHowFormValues = z.infer<typeof EventHowZodSchema>;

const defaultHighlights = () => [{ value: "" }];

const defaultCard: EventHowFormValues["cards"][number] = {
    fileFile: undefined,
    icon: "",
    title: "",
    description: "",
    highlights: defaultHighlights(),
};

type CardFileUploaderProps = {
    control: ReturnType<typeof useForm<EventHowFormValues>>["control"];
    name: `cards.${number}.fileFile`;
    inputId: string;
    existingUrl?: string;
};

const CardFileUploader = ({ control, name, inputId, existingUrl }: CardFileUploaderProps) => {
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
                                alt="How card file preview"
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
    const { control, register, formState } = useFormContext<EventHowFormValues>();
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
                disabled={highlightsFieldArray.fields.length >= 4}
                onClick={() => highlightsFieldArray.append({ value: "" })}
            >
                Add
            </Button>
        </div>
    );
};

const EventsHow = () => {
    const { get, update, getLoading, updateLoading } = useEventHowStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const [currentData, setCurrentData] = useState<EventHowPayload | null>(null);
    const howForm = useForm<EventHowFormValues>({
        defaultValues: {
            description: "",
            cards: [defaultCard],
        },
        resolver: zodResolver(EventHowZodSchema),
        mode: "onChange",
    });

    const cardsValue = useWatch({ control: howForm.control, name: "cards" });
    const descriptionValue = useWatch({ control: howForm.control, name: "description" });

    const cardFields = useFieldArray({
        control: howForm.control,
        name: "cards",
    });

    useEffect(() => {
        let isActive = true;
        const load = async () => {
            setCurrentData(null);
            howForm.reset({ description: "", cards: [defaultCard] });
            howForm.clearErrors();
            const result = await get().catch(() => null);
            if (!isActive) return;
            if (!result) {
                howForm.reset({ description: "", cards: [defaultCard] });
                setCurrentData(null);
                return;
            }
            setCurrentData(result);
            howForm.reset({
                description: result.description ?? "",
                cards: result.cards?.length
                    ? result.cards.map((card) => ({
                        fileFile: undefined,
                        icon: card.icon ?? "",
                        title: card.title ?? "",
                        description: card.description ?? "",
                        highlights: card.highlights?.length
                            ? card.highlights.map((value) => ({ value }))
                            : defaultHighlights(),
                    }))
                    : [defaultCard],
            });
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, howForm]);

    const toList = (items: { value: string }[]) => items.map((item) => item.value.trim()).filter(Boolean);

    const onSubmit = async (formData: EventHowFormValues) => {
        await update({
            description: formData.description,
            cards: formData.cards.map((card) => ({
                fileFile: card.fileFile,
                icon: card.icon,
                title: card.title,
                description: card.description,
                highlights: toList(card.highlights),
            })),
        });
    };

    return (
        <FormProvider {...howForm}>
            {getLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={howForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                <CommonLanguageSwitcherCheckbox />
                <div className="space-y-1 text-white">
                    <h1 className="text-2xl font-semibold text-white">Events How</h1>
                    <p className="text-sm text-white/70">Add description and cards</p>
                </div>
                <Field>
                    <FieldLabel htmlFor="events-how-description" className="text-white/80">
                        Description <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <BasicRichEditor
                            name="description"
                            value={descriptionValue ?? ""}
                        />
                        <FieldError errors={[howForm.formState.errors.description]} />
                    </FieldContent>
                </Field>
                <div className="space-y-6">
                    {cardFields.fields.map((field, index) => (
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
                                    <CardFileUploader
                                        control={howForm.control}
                                        name={`cards.${index}.fileFile`}
                                        inputId={`events-how-file-${index}`}
                                        existingUrl={currentData?.cards?.[index]?.file?.url}
                                    />
                                    <FieldError errors={[howForm.formState.errors.cards?.[index]?.fileFile]} />
                                </FieldContent>
                            </Field>
                            <FieldGroup className="grid gap-4 md:grid-cols-2">
                                <Field>
                                    <FieldLabel htmlFor={`events-how-icon-${index}`} className="text-white/80">
                                        Icon <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`events-how-icon-${index}`}
                                            placeholder="Enter icon"
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...howForm.register(`cards.${index}.icon`)}
                                        />
                                        <FieldError errors={[howForm.formState.errors.cards?.[index]?.icon]} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor={`events-how-title-${index}`} className="text-white/80">
                                        Title <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`events-how-title-${index}`}
                                            placeholder="Enter title"
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...howForm.register(`cards.${index}.title`)}
                                        />
                                        <FieldError errors={[howForm.formState.errors.cards?.[index]?.title]} />
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
                                        value={cardsValue?.[index]?.description ?? ""}
                                    />
                                    <FieldError errors={[howForm.formState.errors.cards?.[index]?.description]} />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel className="text-white/80">Highlights</FieldLabel>
                                <FieldContent>
                                    <HighlightsList cardIndex={index} />
                                </FieldContent>
                            </Field>
                        </div>
                    ))}
                    <Button
                        type="button"
                        className="bg-white/10 text-white hover:bg-white/20"
                        onClick={() => cardFields.append({ ...defaultCard })}
                    >
                        Add card
                    </Button>
                </div>
                <Button
                    type="submit"
                    className="w-full bg-white/90 text-black hover:bg-white"
                    disabled={getLoading || updateLoading || !howForm.formState.isValid}
                >
                    {updateLoading ? "Saving..." : "Save"}
                </Button>
                </form>
            )}
        </FormProvider>
    );
};

const LoadingSkeleton = ({ isRtl }: { isRtl: boolean }) => {
    return (
        <div className={cn("space-y-4", isRtl && "home-rtl")}>
            <CommonLanguageSwitcherCheckbox />
            <div className="space-y-2">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-28 w-full" />
            <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                <Skeleton className="h-24 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
        </div>
    );
};

export default EventsHow;

