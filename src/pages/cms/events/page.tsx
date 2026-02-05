import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import BasicRichEditor from "@/components/tiptap/BasicRichEditor";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventHeroStore } from "@/shared/hooks/store/events/useEventHeroStore";
import type { EventHeroPayload } from "@/shared/hooks/store/events/events.types";
import { Upload } from "lucide-react";

const fileSchema = z.any().refine((file) => !file || file instanceof File, {
    message: "Image must be a file",
});

const eventHeroCardSchema = z.object({
    fileFile: fileSchema.optional(),
    title: z.array(z.string().min(1, "Title is required")).length(8),
    description: z.string().min(10, "Description is required"),
});

export const EventHeroZodSchema = z.object({
    cards: z.array(eventHeroCardSchema).min(1),
});

type EventHeroFormValues = z.infer<typeof EventHeroZodSchema>;

const defaultCard: EventHeroFormValues["cards"][number] = {
    fileFile: undefined,
    title: ["", "", "", "", "", "", "", ""],
    description: "",
};

type CardFileUploaderProps = {
    control: ReturnType<typeof useForm<EventHeroFormValues>>["control"];
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
                                alt="Hero file preview"
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

const EventsHero = () => {
    const { get, update, getLoading, updateLoading } = useEventHeroStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const [currentData, setCurrentData] = useState<EventHeroPayload | null>(null);
    const heroForm = useForm<EventHeroFormValues>({
        defaultValues: {
            cards: [defaultCard],
        },
        resolver: zodResolver(EventHeroZodSchema),
        mode: "onChange",
    });

    const cardFields = useFieldArray({
        control: heroForm.control,
        name: "cards",
    });
    const cardsValue = useWatch({ control: heroForm.control, name: "cards" });

    useEffect(() => {
        let isActive = true;
        const load = async () => {
            setCurrentData(null);
            heroForm.reset({ cards: [defaultCard] });
            heroForm.clearErrors();
            const result = await get().catch(() => null);
            if (!isActive) return;
            if (!result) {
                heroForm.reset({ cards: [defaultCard] });
                setCurrentData(null);
                return;
            }
            setCurrentData(result);
            heroForm.reset({
                cards: result.cards?.length
                    ? result.cards.map((card) => ({
                        fileFile: undefined,
                        title: card.title?.length === 8 ? card.title : ["", "", "", "", "", "", "", ""],
                        description: card.description ?? "",
                    }))
                    : [defaultCard],
            });
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, heroForm]);

    const onSubmit = async (formData: EventHeroFormValues) => {
        await update(formData);
    };

    return (
        <FormProvider {...heroForm}>
            {getLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={heroForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <div className="space-y-1 text-white">
                        <h1 className="text-2xl font-semibold text-white">Events Hero</h1>
                        <p className="text-sm text-white/70">Add hero cards (file, title, description)</p>
                    </div>
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
                                            control={heroForm.control}
                                            name={`cards.${index}.fileFile`}
                                            inputId={`events-hero-file-${index}`}
                                            existingUrl={currentData?.cards?.[index]?.file?.url}
                                        />
                                        <FieldError errors={[heroForm.formState.errors.cards?.[index]?.fileFile]} />
                                    </FieldContent>
                                </Field>
                                <FieldGroup className="grid gap-4 md:grid-cols-4">
                                    {Array.from({ length: 8 }).map((_, titleIndex) => (
                                        <Field key={`events-hero-card-${index}-title-${titleIndex}`}>
                                            <FieldLabel
                                                htmlFor={`events-hero-card-${index}-title-${titleIndex}`}
                                                className="text-white/80"
                                            >
                                                Title {titleIndex + 1} <span className="text-white">*</span>
                                            </FieldLabel>
                                            <FieldContent>
                                                <Input
                                                    id={`events-hero-card-${index}-title-${titleIndex}`}
                                                    placeholder={`Word ${titleIndex + 1}`}
                                                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                    {...heroForm.register(`cards.${index}.title.${titleIndex}`)}
                                                />
                                                <FieldError errors={[heroForm.formState.errors.cards?.[index]?.title?.[titleIndex]]} />
                                            </FieldContent>
                                        </Field>
                                    ))}
                                </FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor={`events-hero-description-${index}`} className="text-white/80">
                                        Description <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <BasicRichEditor
                                            name={`cards.${index}.description`}
                                            value={cardsValue?.[index]?.description ?? ""}
                                        />
                                        <FieldError errors={[heroForm.formState.errors.cards?.[index]?.description]} />
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
                        disabled={getLoading || updateLoading}
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
            <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                <Skeleton className="h-24 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
        </div>
    );
};

export default EventsHero;

