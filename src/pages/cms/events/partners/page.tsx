import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import BasicRichEditor from "@/components/tiptap/BasicRichEditor";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect, useMemo } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventPartnersStore } from "@/shared/hooks/store/events/useEventPartnersStore";
import { usePreviewModalStore } from "@/shared/hooks/store/ui/usePreviewModalStore";
import type { EventFile } from "@/shared/hooks/store/events/events.types";
import { GripVertical, Upload } from "lucide-react";

const fileSchema = z.object({
    file: z.any().optional(),
    existing: z.object({
        url: z.string().optional(),
        path: z.string().optional(),
        contentType: z.string().optional(),
        uploadedAt: z.string().optional(),
    }).optional(),
}).superRefine((value, ctx) => {
    if (!value.file && !value.existing?.url) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "File is required",
            path: ["file"],
        });
    }
});

export const EventPartnersZodSchema = z.object({
    description: z.string().min(10, "Description is required"),
    files: z.array(fileSchema).min(1),
});

type EventPartnersFormValues = z.infer<typeof EventPartnersZodSchema>;

type PartnerThumbnailProps = {
    index: number;
    file?: File | FileList;
    existing?: EventFile;
    canRemove: boolean;
    onRemove: () => void;
    onMove: (from: number, to: number) => void;
    onOpenPreview: (payload: { url: string; isObjectUrl: boolean }) => void;
};

const PartnerThumbnail = ({ index, file, existing, canRemove, onRemove, onMove, onOpenPreview }: PartnerThumbnailProps) => {
    const resolvedFile = file instanceof FileList ? file.item(0) : file;
    const objectUrl = useMemo(() => {
        if (resolvedFile instanceof File) {
            return URL.createObjectURL(resolvedFile);
        }
        return null;
    }, [resolvedFile]);

    useEffect(() => {
        if (!objectUrl) {
            return undefined;
        }
        return () => URL.revokeObjectURL(objectUrl);
    }, [objectUrl]);

    const previewUrl = objectUrl ?? existing?.url ?? null;

    return (
        <div
            draggable
            onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", String(index));
                event.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
                event.preventDefault();
                const fromIndex = Number(event.dataTransfer.getData("text/plain"));
                if (!Number.isNaN(fromIndex) && fromIndex !== index) {
                    onMove(fromIndex, index);
                }
            }}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/5"
        >
            <div className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white/70">
                <GripVertical className="h-3 w-3" />
                Drag
            </div>
            <button
                type="button"
                onClick={() => {
                    const preview = resolvedFile instanceof File
                        ? URL.createObjectURL(resolvedFile)
                        : existing?.url;
                    if (!preview) {
                        return;
                    }
                    onOpenPreview({ url: preview, isObjectUrl: resolvedFile instanceof File });
                }}
                className="relative flex h-32 w-full items-center justify-center bg-black/10"
            >
                {previewUrl ? (
                    <img src={previewUrl} alt="Partner" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center gap-1 text-xs text-white/60">
                        <Upload className="h-4 w-4" />
                        No image
                    </div>
                )}
            </button>
            <div className="flex items-center justify-between px-3 py-2 text-xs text-white/70">
                <span className="truncate">
                    {resolvedFile instanceof File ? resolvedFile.name : existing?.url ? "Current file" : "New file"}
                </span>
                <Button
                    type="button"
                    className="bg-white/10 text-white hover:bg-white/20"
                    disabled={!canRemove}
                    onClick={onRemove}
                >
                    Remove
                </Button>
            </div>
        </div>
    );
};

const EventPartners = () => {
    const { get, update, getLoading, updateLoading } = useEventPartnersStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const openPreview = usePreviewModalStore((state) => state.open);
    const partnersForm = useForm<EventPartnersFormValues>({
        defaultValues: {
            description: "",
            files: [],
        },
        resolver: zodResolver(EventPartnersZodSchema),
        mode: "onChange",
    });

    const fileFields = useFieldArray({
        control: partnersForm.control,
        name: "files",
    });
    const watchedFiles = useWatch({ control: partnersForm.control, name: "files" }) ?? [];
    const descriptionValue = useWatch({ control: partnersForm.control, name: "description" });
    const { errors, isSubmitted } = partnersForm.formState;
    const fileErrors = Array.isArray(errors.files) ? errors.files : [];
    const filesRootMessage = !Array.isArray(errors.files) ? errors.files?.message : undefined;
    const hasSubmitErrors = fileErrors.some(Boolean) || !!errors.description || !!errors.files;

    useEffect(() => {
        let isActive = true;
        const load = async () => {
            partnersForm.reset({ description: "", files: [] });
            partnersForm.clearErrors();

            const result = await get().catch(() => null);
            if (!isActive) return;
            if (!result) {
                partnersForm.reset({ description: "", files: [] });
                return;
            }
            partnersForm.reset({
                description: result.description ?? "",
                files: result.files?.length
                    ? result.files.map((file) => ({
                        file: undefined,
                        existing: file,
                    }))
                    : [],
            });
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, partnersForm]);

    const onSubmit = async (formData: EventPartnersFormValues) => {
        await update({
            description: formData.description,
            files: formData.files.map((item) => ({
                file: item.file as File | undefined,
                existing: item.existing,
            })),
        });
    };

    return (
        <FormProvider {...partnersForm}>
            {getLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={partnersForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                <CommonLanguageSwitcherCheckbox />
                <div className="space-y-1 text-white">
                    <h1 className="text-2xl font-semibold text-white">Events Partners</h1>
                    <p className="text-sm text-white/70">Add partner logos and description</p>
                </div>
                <Field>
                    <FieldLabel htmlFor="events-partners-description" className="text-white/80">
                        Description <span className="text-white">*</span> (at least 10 characters)
                    </FieldLabel>
                    <FieldContent>
                        <BasicRichEditor
                            name="description"
                            value={descriptionValue ?? ""}
                        />
                    </FieldContent>
                </Field>
                <Field>
                    <FieldLabel htmlFor="events-partners-upload" className="text-white/80">
                        Partner logos <span className="text-white">*</span> (required)
                    </FieldLabel>
                    <FieldContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <label
                                    htmlFor="events-partners-upload"
                                    className="relative flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-white/30 bg-white/5 text-xs text-white/70 transition hover:bg-white/10"
                                >
                                    <Upload size={22} className="text-white/70" />
                                    <span className="text-center">Upload images</span>
                                </label>
                                <span className="text-xs text-white/60">PNG, JPG up to 5MB each</span>
                                <span className="text-xs text-white/50">Drag to reorder</span>
                                <input
                                    id="events-partners-upload"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(event) => {
                                        const files = Array.from(event.target.files ?? []);
                                        if (!files.length) {
                                            return;
                                        }
                                        fileFields.append(
                                            files.map((file) => ({
                                                file,
                                                existing: undefined,
                                            }))
                                        );
                                        event.currentTarget.value = "";
                                    }}
                                />
                            </div>
                            {fileFields.fields.length ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {fileFields.fields.map((field, index) => (
                                        <PartnerThumbnail
                                            key={field.id}
                                            index={index}
                                            file={watchedFiles[index]?.file}
                                            existing={watchedFiles[index]?.existing}
                                            canRemove={fileFields.fields.length > 1}
                                            onRemove={() => fileFields.remove(index)}
                                            onMove={fileFields.move}
                                            onOpenPreview={({ url, isObjectUrl }) => {
                                                openPreview({
                                                    type: "image",
                                                    url,
                                                    title: "Event Partner File",
                                                    isObjectUrl,
                                                });
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </FieldContent>
                </Field>
                {isSubmitted && hasSubmitErrors ? (
                    <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                        <p className="font-medium">Please fix the following fields:</p>
                        <ul className="mt-2 list-disc pl-5">
                            {errors.description ? <li>Description</li> : null}
                            {fileErrors.map((error, index) =>
                                error ? <li key={`events-partners-file-${index}`}>Partner logo {index + 1}</li> : null
                            )}
                            {filesRootMessage ? <li>{filesRootMessage}</li> : null}
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
            </div>
            <Skeleton className="h-10 w-full" />
        </div>
    );
};

export default EventPartners;

