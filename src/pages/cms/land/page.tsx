import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useLandHeroStore } from "@/shared/hooks/store/land/useLandHeroStore";
import { usePreviewModalStore } from "@/shared/hooks/store/ui/usePreviewModalStore";
import { Link as LinkIcon, Play } from "lucide-react";

const heroFileSchema = z.object({
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

export const LandHeroZodSchema = z.object({
    title: z.array(z.string().min(1, "Title is required")).length(6),
    description: z.string().min(10, "Description is required"),
    file: heroFileSchema,
});

type LandHeroFormValues = z.infer<typeof LandHeroZodSchema>;

const LandHero = () => {
    const { get, update, getLoading, updateLoading } = useLandHeroStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const openPreview = usePreviewModalStore((state) => state.open);
    const heroForm = useForm<LandHeroFormValues>({
        defaultValues: {
            title: ["", "", "", "", "", ""],
            description: "",
            file: {
                linkType: "image",
                linkUrl: "",
                fileFile: undefined,
                existing: undefined,
            },
        },
        resolver: zodResolver(LandHeroZodSchema),
        mode: "onChange",
    });
    const { reset } = heroForm;
    const watchedFile = useWatch({ control: heroForm.control, name: "file" });
    const linkType = watchedFile?.linkType ?? "image";
    const linkUrlError = heroForm.formState.errors.file?.linkUrl;
    const linkFileError = heroForm.formState.errors.file?.fileFile;
    const fileValue = watchedFile?.fileFile;
    const existingFile = watchedFile?.existing;
    const objectUrl = useMemo(() => (fileValue instanceof File ? URL.createObjectURL(fileValue) : null), [fileValue]);
    const previewUrl = objectUrl ?? existingFile?.url ?? null;

    useEffect(() => {
        if (!objectUrl) {
            return undefined;
        }
        return () => URL.revokeObjectURL(objectUrl);
    }, [objectUrl]);

    useEffect(() => {
        let isActive = true;

        const load = async () => {
            setIsInitialLoad(true);
            const result = await get().catch(() => null);
            if (!isActive) return;
            if (!result) {
                reset({
                    title: ["", "", "", "", "", ""],
                    description: "",
                    file: {
                        linkType: "image",
                        linkUrl: "",
                        fileFile: undefined,
                        existing: undefined,
                    },
                });
                setIsInitialLoad(false);
                return;
            }
            reset({
                title: result.title?.length === 6 ? result.title : ["", "", "", "", "", ""],
                description: result.description ?? "",
                file: {
                    linkType: result.file?.contentType === "video" ? "video" : result.file?.contentType === "link" ? "link" : "image",
                    linkUrl: result.file?.url ?? "",
                    fileFile: undefined,
                    existing: result.file,
                },
            });
            setIsInitialLoad(false);
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, reset]);

    const onSubmit = async (formData: LandHeroFormValues) => {
        await update(formData);
    };

    const showLoading = getLoading || isInitialLoad;

    return (
        <FormProvider {...heroForm}>
            {showLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={heroForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <div className="space-y-1 text-white">
                        <h1 className="text-2xl font-semibold text-white">Land Hero</h1>
                        <p className="text-sm text-white/70">Add the hero title and description</p>
                    </div>
                    <Field>
                        <FieldLabel htmlFor="land-hero-file" className="text-white/80">
                            Hero media <span className="text-white">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                <div className="w-full md:w-48">
                                    <Controller
                                        control={heroForm.control}
                                        name="file.linkType"
                                        render={({ field }) => (
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger
                                                    id="land-hero-file-type"
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
                                </div>
                                <div className="flex w-full flex-1 items-center gap-3">
                                    {linkType === "link" ? (
                                        <>
                                            <div className="flex w-full items-center gap-2 rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white">
                                                <LinkIcon size={16} className="text-white/60" />
                                                <Input
                                                    id="land-hero-file"
                                                    placeholder="Paste link (youtube...)"
                                                    className="border-none bg-transparent p-0 text-white placeholder:text-white/40 focus-visible:ring-0"
                                                    {...heroForm.register("file.linkUrl")}
                                                />
                                            </div>
                                            <FieldError errors={[linkUrlError as { message?: string } | undefined]} />
                                        </>
                                    ) : (
                                        <Controller
                                            control={heroForm.control}
                                            name="file.fileFile"
                                            render={({ field }) => (
                                                <>
                                                    <label
                                                        htmlFor="land-hero-file"
                                                        className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
                                                    >
                                                        {`Upload ${linkType}`}
                                                    </label>
                                                    {field.value instanceof File ? (
                                                        <button
                                                            type="button"
                                                            className="flex items-center gap-2 text-xs text-white/80"
                                                            onClick={() => {
                                                                if (!previewUrl) {
                                                                    return;
                                                                }
                                                                openPreview({
                                                                    type: linkType === "video" ? "video" : "image",
                                                                    url: previewUrl,
                                                                    title: "Land Hero Preview",
                                                                });
                                                            }}
                                                        >
                                                            <span className="truncate">{field.value.name}</span>
                                                            {linkType === "video" ? (
                                                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-white/10">
                                                                    <Play size={14} />
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex h-8 w-8 overflow-hidden rounded-md border border-white/20 bg-white/10">
                                                                    {previewUrl ? (
                                                                        <img src={previewUrl} alt="Selected preview" className="h-full w-full object-cover" />
                                                                    ) : null}
                                                                </span>
                                                            )}
                                                        </button>
                                                    ) : previewUrl ? (
                                                        <button
                                                            type="button"
                                                            className="flex items-center gap-2 text-xs text-white/80"
                                                            onClick={() => {
                                                                openPreview({
                                                                    type: linkType === "video" ? "video" : "image",
                                                                    url: previewUrl,
                                                                    title: "Land Hero Preview",
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
                                                                    {previewUrl ? (
                                                                        <img src={previewUrl} alt="Current preview" className="h-full w-full object-cover" />
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
                                                        id="land-hero-file"
                                                        key={`land-hero-file-${linkType}`}
                                                        type="file"
                                                        accept={linkType === "video" ? "video/*" : "image/*"}
                                                        className="hidden"
                                                        onChange={(event) => {
                                                            const file = event.target.files?.[0];
                                                            field.onChange(file ?? undefined);
                                                        }}
                                                    />
                                                    <FieldError errors={[linkFileError as { message?: string } | undefined]} />
                                                </>
                                            )}
                                        />
                                    )}
                                </div>
                            </div>
                        </FieldContent>
                    </Field>
                    <FieldGroup className="grid gap-4 md:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Field key={`land-hero-title-${index}`}>
                                <FieldLabel htmlFor={`land-hero-title-${index}`} className="text-white/80">
                                    Title chunk {index + 1} <span className="text-white">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id={`land-hero-title-${index}`}
                                        placeholder={`Word ${index + 1}`}
                                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                        {...heroForm.register(`title.${index}`)}
                                    />
                                    <FieldError errors={[heroForm.formState.errors.title?.[index]]} />
                                </FieldContent>
                            </Field>
                        ))}
                    </FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="land-hero-description" className="text-white/80">
                            Description <span className="text-white">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <Textarea
                                id="land-hero-description"
                                placeholder="Enter description"
                                className="min-h-28 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                {...heroForm.register("description")}
                            />
                            <FieldError errors={[heroForm.formState.errors.description]} />
                        </FieldContent>
                    </Field>
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
            <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={`land-hero-title-skeleton-${index}`} className="h-10 w-full" />
                ))}
            </div>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    );
};

export default LandHero;

