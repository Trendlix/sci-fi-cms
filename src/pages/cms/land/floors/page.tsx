import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import type { Control, FieldErrors, UseFormRegister, UseFormResetField, UseFormSetValue } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useLandFloorsStore } from "@/shared/hooks/store/land/useLandFloorsStore";
import { usePreviewModalStore } from "@/shared/hooks/store/ui/usePreviewModalStore";
import { Link as LinkIcon, Play } from "lucide-react";

const floorSchema = z.object({
    title: z.string().min(3, "Title is required").max(20),
    description: z.string().min(10, "Description is required"),
    linkType: z.enum(["image", "video", "link"]),
    linkUrl: z.string().optional(),
    fileFile: z.any().optional(),
    existing: z.object({
        url: z.string().optional(),
        path: z.string().optional(),
        contentType: z.string().optional(),
        uploadedAt: z.string().optional(),
    }).optional(),
}).superRefine((value, ctx) => {
    const trimmedUrl = value.linkUrl?.trim();
    if (value.linkType === "link" && !trimmedUrl) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Link URL is required",
            path: ["linkUrl"],
        });
    }

    if (value.linkType !== "link" && !value.fileFile && !value.existing?.url) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Upload file is required",
            path: ["fileFile"],
        });
    }
});

export const FloorsZodSchema = z.object({
    floors: z.array(floorSchema).min(1),
});

type FloorsFormValues = z.infer<typeof FloorsZodSchema>;

const defaultFloor: FloorsFormValues["floors"][number] = {
    title: "",
    description: "",
    linkType: "image",
    linkUrl: "",
    fileFile: undefined,
    existing: undefined,
};

type LinkTypeValue = "image" | "video" | "link" | undefined;

type FloorFieldsProps = {
    index: number;
    control: Control<FloorsFormValues>;
    register: UseFormRegister<FloorsFormValues>;
    setValue: UseFormSetValue<FloorsFormValues>;
    resetField: UseFormResetField<FloorsFormValues>;
    errors: FieldErrors<FloorsFormValues>;
    onRemove: () => void;
    canRemove: boolean;
    trigger: ReturnType<typeof useForm<FloorsFormValues>>["trigger"];
};

const FloorFields = ({
    index,
    control,
    register,
    setValue,
    resetField,
    errors,
    onRemove,
    canRemove,
    trigger,
}: FloorFieldsProps) => {
    const openPreview = usePreviewModalStore((state) => state.open);
    const linkType = useWatch({ control, name: `floors.${index}.linkType` });
    const linkFile = useWatch({ control, name: `floors.${index}.fileFile` });
    const linkUrl = useWatch({ control, name: `floors.${index}.linkUrl` });
    const linkUrlError = errors?.floors?.[index]?.linkUrl;
    const linkFileError = errors?.floors?.[index]?.fileFile;
    const savedValuesRef = useRef<Record<string, { url?: string; file?: File }>>({});
    const filePreviewUrl = useMemo(() => {
        if (linkFile instanceof File) {
            return URL.createObjectURL(linkFile);
        }
        if (typeof linkUrl === "string" && linkUrl.length > 0) {
            return linkUrl;
        }
        return null;
    }, [linkFile, linkUrl]);

    useEffect(() => {
        if (!filePreviewUrl) {
            return undefined;
        }
        if (linkFile instanceof File) {
            return () => URL.revokeObjectURL(filePreviewUrl);
        }
        return undefined;
    }, [filePreviewUrl, linkFile]);

    const handleTypeChange = (nextType: LinkTypeValue) => {
        if (!linkType) {
            return;
        }
        savedValuesRef.current[linkType] = {
            url: linkUrl,
            file: linkFile instanceof File ? linkFile : undefined,
        };

        const restored = savedValuesRef.current[nextType ?? ""] ?? {};
        setValue(`floors.${index}.linkUrl`, restored.url ?? "", {
            shouldDirty: true,
            shouldValidate: false,
        });
        setValue(`floors.${index}.fileFile`, restored.file ?? undefined, {
            shouldDirty: true,
            shouldValidate: false,
        });

        setTimeout(() => {
            trigger(`floors.${index}.linkUrl`);
            trigger(`floors.${index}.fileFile`);
        }, 0);
    };

    return (
        <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Floor {index + 1}</h2>
                <Button
                    type="button"
                    className="bg-white/10 text-white hover:bg-white/20"
                    disabled={!canRemove}
                    onClick={onRemove}
                >
                    Remove
                </Button>
            </div>
            <FieldGroup className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)] items-end">
                <Field>
                    <FieldLabel htmlFor={`floor-type-${index}`} className="text-white/80">
                        Type <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <Controller
                            control={control}
                            name={`floors.${index}.linkType`}
                            render={({ field: controllerField }) => (
                                <Select
                                    value={controllerField.value}
                                    onValueChange={(value) => {
                                        controllerField.onChange(value);
                                        resetField(`floors.${index}.fileFile`, { keepDirty: true });
                                        resetField(`floors.${index}.linkUrl`, { keepDirty: true });
                                        handleTypeChange(value as LinkTypeValue);
                                    }}
                                >
                                    <SelectTrigger
                                        id={`floor-type-${index}`}
                                        className="w-full border-white/20 bg-white/5 text-white focus-visible:border-white/40"
                                    >
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] text-white">
                                        <SelectItem value="image">Image</SelectItem>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="link">Link</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </FieldContent>
                </Field>
                <Field>
                    <FieldLabel htmlFor={`floor-input-${index}`} className="text-white/80">
                        {linkType === "link" ? "Paste link" : `Upload ${linkType ?? "image"}`}
                        <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        {linkType === "link" ? (
                            <div className="flex items-center gap-3">
                                <InputGroup className="border-white/20 bg-white/5 text-white focus-visible:border-white/40">
                                    <InputGroupAddon className="text-white/60">
                                        {linkUrl && !linkUrlError ? (
                                            <a
                                                href={linkUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-white/80 hover:text-white"
                                            >
                                                <LinkIcon size={16} />
                                            </a>
                                        ) : (
                                            <LinkIcon size={16} />
                                        )}
                                    </InputGroupAddon>
                                    <InputGroupInput
                                        id={`floor-input-${index}`}
                                        key={`floor-url-${index}-${linkType}`}
                                        placeholder="Paste link (youtube...)"
                                        className="text-white placeholder:text-white/40"
                                        {...register(`floors.${index}.linkUrl`)}
                                    />
                                </InputGroup>
                                <FieldError errors={[linkUrlError as { message?: string } | undefined]} />
                            </div>
                        ) : (
                            <Controller
                                control={control}
                                name={`floors.${index}.fileFile`}
                                render={({ field: controllerField }) => (
                                    <div className="flex items-center gap-3">
                                        <label
                                            htmlFor={`floor-input-${index}`}
                                            className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
                                        >
                                            {`Upload ${linkType ?? "image"}`}
                                        </label>
                                        {controllerField.value instanceof File ? (
                                            <button
                                                type="button"
                                                className="flex items-center gap-2 text-xs text-white/80"
                                                onClick={() => {
                                                    if (!filePreviewUrl) {
                                                        return;
                                                    }
                                                    openPreview({
                                                        type: linkType === "video" ? "video" : "image",
                                                        url: filePreviewUrl,
                                                        title: "Floor Preview",
                                                    });
                                                }}
                                            >
                                                <span className="truncate">{controllerField.value.name}</span>
                                                {linkType === "video" ? (
                                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-white/10">
                                                        <Play size={14} />
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex h-8 w-8 overflow-hidden rounded-md border border-white/20 bg-white/10">
                                                        {filePreviewUrl ? (
                                                            <img
                                                                src={filePreviewUrl}
                                                                alt="Selected preview"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : null}
                                                    </span>
                                                )}
                                            </button>
                                        ) : linkUrl ? (
                                            <button
                                                type="button"
                                                className="flex items-center gap-2 text-xs text-white/80"
                                                onClick={() => {
                                                    if (!filePreviewUrl) {
                                                        return;
                                                    }
                                                    openPreview({
                                                        type: linkType === "video" ? "video" : "image",
                                                        url: filePreviewUrl,
                                                        title: "Floor Preview",
                                                    });
                                                }}
                                            >
                                                <span className="truncate">Current {linkType} file</span>
                                                {linkType === "video" ? (
                                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-white/10">
                                                        <Play size={14} />
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex h-8 w-8 overflow-hidden rounded-md border border-white/20 bg-white/10">
                                                        {filePreviewUrl ? (
                                                            <img
                                                                src={filePreviewUrl}
                                                                alt="Current preview"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : null}
                                                    </span>
                                                )}
                                            </button>
                                        ) : (
                                            <span className="text-xs text-white/60">
                                                {linkType === "video" ? "MP4, MOV up to 50MB" : "PNG, JPG up to 5MB"}
                                            </span>
                                        )}
                                        <input
                                            id={`floor-input-${index}`}
                                            key={`floor-file-${index}-${linkType}`}
                                            type="file"
                                            accept={linkType === "video" ? "video/*" : "image/*"}
                                            className="hidden"
                                            onChange={(event) => {
                                                const file = event.target.files?.[0];
                                                controllerField.onChange(file ?? undefined);
                                            }}
                                        />
                                        <FieldError errors={[linkFileError as { message?: string } | undefined]} />
                                    </div>
                                )}
                            />
                        )}
                    </FieldContent>
                </Field>
            </FieldGroup>
            <FieldGroup className="grid gap-4 md:grid-cols-2">
                <Field>
                    <FieldLabel htmlFor={`floor-title-${index}`} className="text-white/80">
                        Title <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <Input
                            id={`floor-title-${index}`}
                            placeholder="Title"
                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                            {...register(`floors.${index}.title`)}
                        />
                        <FieldError errors={[errors?.floors?.[index]?.title]} />
                    </FieldContent>
                </Field>
                <Field className="md:col-span-2">
                    <FieldLabel htmlFor={`floor-description-${index}`} className="text-white/80">
                        Description <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <Textarea
                            id={`floor-description-${index}`}
                            placeholder="Floor description"
                            className="min-h-24 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                            {...register(`floors.${index}.description`)}
                        />
                        <FieldError errors={[errors?.floors?.[index]?.description]} />
                    </FieldContent>
                </Field>
            </FieldGroup>
        </div>
    );
};

const LandFloors = () => {
    const { data, get, update, getLoading, updateLoading } = useLandFloorsStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const currentData = data?.[language] ?? null;
    const floorsForm = useForm<FloorsFormValues>({
        defaultValues: {
            floors: [defaultFloor],
        },
        resolver: zodResolver(FloorsZodSchema),
        mode: "onChange",
    });

    const floorFields = useFieldArray({
        control: floorsForm.control,
        name: "floors",
    });

    useEffect(() => {
        void get();
    }, [get, language, floorsForm]);

    useEffect(() => {
        if (currentData === null) {
            return;
        }
        if (!currentData.length) {
            floorsForm.reset({ floors: [defaultFloor] });
        } else {
            floorsForm.reset({
                floors: currentData.map((floor) => ({
                    title: floor.title ?? "",
                    description: floor.description ?? "",
                    linkType: floor.file?.contentType === "video" ? "video" : floor.file?.contentType === "link" ? "link" : "image",
                    linkUrl: floor.file?.url ?? "",
                    fileFile: undefined,
                    existing: floor.file,
                })),
            });
        }
    }, [currentData, floorsForm]);

    const onSubmit = async (formData: FloorsFormValues) => {
        await update(formData.floors);
    };

    return (
        <FormProvider {...floorsForm}>
            {getLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={floorsForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <div className="space-y-1 text-white">
                        <h1 className="text-2xl font-semibold text-white">Floors</h1>
                        <p className="text-sm text-white/70">Add floor items</p>
                    </div>
                    <div className="space-y-6">
                        {floorFields.fields.map((field, index) => (
                            <FloorFields
                                key={field.id}
                                index={index}
                                control={floorsForm.control}
                                register={floorsForm.register}
                                setValue={floorsForm.setValue}
                                resetField={floorsForm.resetField}
                                errors={floorsForm.formState.errors}
                                onRemove={() => floorFields.remove(index)}
                                canRemove={floorFields.fields.length > 1}
                                trigger={floorsForm.trigger}
                            />
                        ))}
                    </div>
                    <Button
                        type="button"
                        className="bg-white/10 text-white hover:bg-white/20"
                        onClick={() => floorFields.append({ ...defaultFloor })}
                    >
                        Add floor
                    </Button>
                    <Button
                        type="submit"
                        className="w-full bg-white/90 text-black hover:bg-white"
                        disabled={getLoading || updateLoading || !floorsForm.formState.isValid}
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
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
        </div>
    );
};

export default LandFloors;

