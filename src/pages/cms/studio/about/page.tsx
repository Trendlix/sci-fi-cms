import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
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
import { useStudioAboutStore } from "@/shared/hooks/store/studio/useStudioAboutStore";
import { usePreviewModalStore } from "@/shared/hooks/store/ui/usePreviewModalStore";
import { Upload, Image as ImageIcon } from "lucide-react";
import type { StudioAboutPayload } from "@/shared/hooks/store/studio/studio.types";

const cardSchema = z.object({
    tag: z.string().min(1, "Tag is required"),
    icon: z.string().min(1, "Icon is required"),
    title: z.string().min(3, "Title is required").max(20),
    description: z.string().min(1, "Description is required"),
    fileFile: z.any().optional(),
});

export const StudioAboutZodSchema = z.object({
    description: z.string().min(10, "Description is required"),
    cards: z.array(cardSchema).min(1),
});

type StudioAboutFormValues = z.infer<typeof StudioAboutZodSchema>;

const defaultCard: StudioAboutFormValues["cards"][number] = {
    tag: "",
    icon: "",
    title: "",
    description: "",
    fileFile: undefined,
};

const STUDIO_ABOUT_DEFAULT_VALUES: StudioAboutFormValues = {
    description: "",
    cards: [defaultCard],
};

type CardFileUploaderProps = {
    control: ReturnType<typeof useForm<StudioAboutFormValues>>["control"];
    name: `cards.${number}.fileFile`;
    inputId: string;
    existingUrl?: string;
    onOpenPreview: () => void;
};

const CardFileUploader = ({ control, name, inputId, existingUrl, onOpenPreview }: CardFileUploaderProps) => {
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
                        className="relative flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-white/30 bg-white/5 text-xs text-white/70 transition hover:bg-white/10"
                    >
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Image preview"
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        ) : (
                            <>
                                <Upload size={22} className="text-white/70" />
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
                    <button
                        type="button"
                        className="text-xs text-white/70 underline-offset-2 hover:underline"
                        onClick={onOpenPreview}
                        disabled={!previewUrl}
                    >
                        Preview
                    </button>
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

const StudioAbout = () => {
    const { get, update, getLoading, updateLoading } = useStudioAboutStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const openPreview = usePreviewModalStore((state) => state.open);
    const [currentData, setCurrentData] = useState<StudioAboutPayload | null>(null);
    const aboutForm = useForm<StudioAboutFormValues>({
        defaultValues: STUDIO_ABOUT_DEFAULT_VALUES,
        resolver: zodResolver(StudioAboutZodSchema),
        mode: "onChange",
    });
    const cardsValue = useWatch({ control: aboutForm.control, name: "cards" });
    const descriptionValue = useWatch({ control: aboutForm.control, name: "description" });
    const { errors, isSubmitted } = aboutForm.formState;
    const cardErrors = Array.isArray(errors.cards) ? errors.cards : [];
    const hasSubmitErrors = cardErrors.some(Boolean) || !!errors.description;

    const cardFields = useFieldArray({
        control: aboutForm.control,
        name: "cards",
    });

    useEffect(() => {
        let isActive = true;
        aboutForm.reset(STUDIO_ABOUT_DEFAULT_VALUES);
        aboutForm.clearErrors();

        const load = async () => {
            const result = await get().catch(() => null);
            if (!isActive) return;
            if (!result) {
                aboutForm.reset(STUDIO_ABOUT_DEFAULT_VALUES);
                setCurrentData(null);
                return;
            }
            setCurrentData(result);
            aboutForm.reset({
                description: result.description ?? "",
                cards: result.cards?.length
                    ? result.cards.map((card) => ({
                        tag: card.tag ?? "",
                        icon: card.icon ?? "",
                        title: card.title ?? "",
                        description: card.description ?? "",
                        fileFile: undefined,
                    }))
                    : [defaultCard],
            });
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, aboutForm]);

    const onSubmit = async (formData: StudioAboutFormValues) => {
        const missingImages: number[] = [];
        formData.cards.forEach((card, index) => {
            const hasExisting = !!currentData?.cards?.[index]?.file?.url;
            if (!card.fileFile && !hasExisting) {
                missingImages.push(index);
            }
        });
        if (missingImages.length > 0) {
            missingImages.forEach((index) => {
                aboutForm.setError(`cards.${index}.fileFile`, {
                    type: "manual",
                    message: "Image is required",
                });
            });
            return;
        }
        await update(formData);
        const refreshed = await get().catch(() => null);
        if (!refreshed) {
            aboutForm.reset(STUDIO_ABOUT_DEFAULT_VALUES);
            setCurrentData(null);
            return;
        }
        setCurrentData(refreshed);
        aboutForm.reset({
            description: refreshed.description ?? "",
            cards: refreshed.cards?.length
                ? refreshed.cards.map((card) => ({
                    tag: card.tag ?? "",
                    icon: card.icon ?? "",
                    title: card.title ?? "",
                    description: card.description ?? "",
                    fileFile: undefined,
                }))
                : [defaultCard],
        });
    };

    return (
        <FormProvider {...aboutForm}>
            {getLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={aboutForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <div className="space-y-1 text-white">
                        <h1 className="text-2xl font-semibold text-white">Studio About</h1>
                        <p className="text-sm text-white/70">Add the description and cards</p>
                    </div>
                    <Field>
                        <FieldLabel htmlFor="studio-about-description" className="text-white/80">
                            Description <span className="text-white">*</span> (at least 10 characters)
                        </FieldLabel>
                        <FieldContent>
                            <BasicRichEditor name="description" value={descriptionValue ?? ""} />
                        </FieldContent>
                    </Field>
                    <div className="space-y-6">
                        {cardFields.fields.map((field, index) => (
                            <div key={field.id} className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-white">
                                        <ImageIcon size={16} className="text-white/70" />
                                        <h2 className="text-lg font-semibold text-white">Card {index + 1}</h2>
                                    </div>
                                    <Button
                                        type="button"
                                        className="bg-white/10 text-white hover:bg-white/20"
                                        disabled={cardFields.fields.length <= 1}
                                        onClick={() => cardFields.remove(index)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                                <FieldGroup className="grid gap-4 md:grid-cols-2">
                                    <Field className="md:col-span-2">
                                        <FieldLabel htmlFor={`studio-about-file-${index}`} className="text-white/80">
                                            Image <span className="text-white">*</span> (required)
                                        </FieldLabel>
                                        <FieldContent>
                                            <CardFileUploader
                                                control={aboutForm.control}
                                                name={`cards.${index}.fileFile`}
                                                inputId={`studio-about-file-${index}`}
                                                existingUrl={currentData?.cards?.[index]?.file?.url}
                                                onOpenPreview={() => {
                                                    const currentUrl = currentData?.cards?.[index]?.file?.url;
                                                    const file = aboutForm.getValues(`cards.${index}.fileFile`);
                                                    const previewUrl = file instanceof File ? URL.createObjectURL(file) : currentUrl;
                                                    if (!previewUrl) {
                                                        return;
                                                    }
                                                    openPreview({
                                                        type: "image",
                                                        url: previewUrl,
                                                        title: "Studio About Image",
                                                        isObjectUrl: file instanceof File,
                                                    });
                                                }}
                                            />
                                        </FieldContent>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor={`studio-about-tag-${index}`} className="text-white/80">
                                            Tag <span className="text-white">*</span> (required)
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`studio-about-tag-${index}`}
                                                placeholder="Tag"
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...aboutForm.register(`cards.${index}.tag`)}
                                            />
                                        </FieldContent>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor={`studio-about-icon-${index}`} className="text-white/80">
                                            Icon <span className="text-white">*</span> (required)
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`studio-about-icon-${index}`}
                                                placeholder="Icon name"
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...aboutForm.register(`cards.${index}.icon`)}
                                            />
                                        </FieldContent>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor={`studio-about-title-${index}`} className="text-white/80">
                                            Title <span className="text-white">*</span> (at least 3 characters)
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`studio-about-title-${index}`}
                                                placeholder="Card title"
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...aboutForm.register(`cards.${index}.title`)}
                                            />
                                        </FieldContent>
                                    </Field>
                                    <Field className="md:col-span-2">
                                        <FieldLabel htmlFor={`studio-about-description-${index}`} className="text-white/80">
                                            Description <span className="text-white">*</span> (required)
                                        </FieldLabel>
                                        <FieldContent>
                                            <BasicRichEditor
                                                name={`cards.${index}.description`}
                                                value={cardsValue?.[index]?.description ?? ""}
                                            />
                                        </FieldContent>
                                    </Field>
                                </FieldGroup>
                            </div>
                        ))}
                    </div>
                    <Button
                        type="button"
                        className="bg-white/10 text-white hover:bg-white/20"
                        onClick={() => cardFields.append(defaultCard)}
                    >
                        Add card
                    </Button>
                    {isSubmitted && hasSubmitErrors ? (
                        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                            <p className="font-medium">Please fix the following fields:</p>
                            <ul className="mt-2 list-disc pl-5">
                                {errors.description ? <li>Description</li> : null}
                                {cardErrors.map((error, index) => {
                                    if (!error) {
                                        return null;
                                    }
                                    const items = [];
                                    if (error.fileFile) {
                                        items.push(<li key={`studio-about-file-${index}`}>Card {index + 1} image</li>);
                                    }
                                    if (error.tag) {
                                        items.push(<li key={`studio-about-tag-${index}`}>Card {index + 1} tag</li>);
                                    }
                                    if (error.icon) {
                                        items.push(<li key={`studio-about-icon-${index}`}>Card {index + 1} icon</li>);
                                    }
                                    if (error.title) {
                                        items.push(<li key={`studio-about-title-${index}`}>Card {index + 1} title</li>);
                                    }
                                    if (error.description) {
                                        items.push(
                                            <li key={`studio-about-description-${index}`}>Card {index + 1} description</li>
                                        );
                                    }
                                    return items;
                                })}
                            </ul>
                        </div>
                    ) : null}
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
            <Skeleton className="h-28 w-full" />
            <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
        </div>
    );
};

export default StudioAbout;

