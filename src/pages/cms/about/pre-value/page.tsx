import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import BasicRichEditor from "@/components/tiptap/BasicRichEditor";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Link, Play } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useAboutStore } from "@/shared/hooks/store/about/useAboutStore";
import { usePreviewModalStore } from "@/shared/hooks/store/ui/usePreviewModalStore";
import type { AboutPayload } from "@/shared/hooks/store/about/about.types";

export const AboutPreValueZodSchema = z.object({
    title: z.array(z.string().min(1, "Title is required")).length(5),
    description: z.string().min(10, "Description is required").max(100),
    linkType: z.enum(["image", "video", "link"]),
    linkUrl: z.string().optional(),
    linkFile: z.any().optional(),
}).superRefine((value, ctx) => {
    const trimmedUrl = value.linkUrl?.trim();
    if (value.linkType === "link" && !trimmedUrl) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Link URL is required",
            path: ["linkUrl"],
        });
    }
    if (value.linkType !== "link" && !value.linkFile && !trimmedUrl) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Upload file is required",
            path: ["linkFile"],
        });
    }
});

type AboutPreValueFormValues = z.infer<typeof AboutPreValueZodSchema>;

type LinkTypeValue = "image" | "video" | "link";

const resolveLinkType = (contentType?: string, url?: string): LinkTypeValue => {
    if (contentType === "link") return "link";
    if (contentType?.startsWith("video/")) return "video";
    if (contentType?.startsWith("image/")) return "image";
    if (contentType === "video") return "video";
    if (contentType === "image") return "image";
    if (url) return "image";
    return "image";
};

type LinkTypeFieldProps = {
    control: ReturnType<typeof useForm<AboutPreValueFormValues>>["control"];
    resetField: ReturnType<typeof useForm<AboutPreValueFormValues>>["resetField"];
    onChangeType: (nextType: LinkTypeValue) => void;
};

const LinkTypeField = ({ control, resetField, onChangeType }: LinkTypeFieldProps) => (
    <Field>
        <FieldLabel htmlFor="pre-value-link-type" className="text-white/80">
            Type <span className="text-white">*</span>
        </FieldLabel>
        <FieldContent>
            <Controller
                control={control}
                name="linkType"
                render={({ field: controllerField }) => (
                    <Select
                        value={controllerField.value}
                        onValueChange={(value) => {
                            controllerField.onChange(value);
                            resetField("linkFile", { keepDirty: true });
                            resetField("linkUrl", { keepDirty: true });
                            onChangeType(value as LinkTypeValue);
                        }}
                    >
                        <SelectTrigger
                            id="pre-value-link-type"
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
);

type LinkTargetFieldProps = {
    control: ReturnType<typeof useForm<AboutPreValueFormValues>>["control"];
    register: ReturnType<typeof useForm<AboutPreValueFormValues>>["register"];
    linkType: LinkTypeValue;
    linkUrl?: string;
    linkUrlError?: { message?: string };
    linkFileError?: { message?: string };
    filePreviewUrl: string | null;
    onOpenPreview: () => void;
};

const LinkTargetField = ({
    control,
    register,
    linkType,
    linkUrl,
    linkUrlError,
    linkFileError,
    filePreviewUrl,
    onOpenPreview,
}: LinkTargetFieldProps) => (
    <Field>
        <FieldLabel htmlFor="pre-value-link-input" className="text-white/80">
            {linkType === "link" ? "Paste link" : `Upload ${linkType}`}
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
                                    <Link size={16} />
                                </a>
                            ) : (
                                <Link size={16} />
                            )}
                        </InputGroupAddon>
                        <InputGroupInput
                            id="pre-value-link-input"
                            key={`pre-value-link-${linkType}`}
                            placeholder="Paste link (youtube...)"
                            className="text-white placeholder:text-white/40"
                            {...register("linkUrl")}
                        />
                    </InputGroup>
                    <FieldError errors={[linkUrlError]} />
                </div>
            ) : (
                <Controller
                    control={control}
                    name="linkFile"
                    render={({ field: controllerField }) => (
                        <div className="flex items-center gap-3">
                            <label
                                htmlFor="pre-value-link-input"
                                className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
                            >
                                {`Upload ${linkType}`}
                            </label>
                            {controllerField.value instanceof File ? (
                                <button
                                    type="button"
                                    className="flex items-center gap-2 text-xs text-white/80"
                                    onClick={onOpenPreview}
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
                                    onClick={onOpenPreview}
                                >
                                    <span className="truncate">Current {linkType} link</span>
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
                                id="pre-value-link-input"
                                key={`pre-value-link-file-${linkType}`}
                                type="file"
                                accept={linkType === "video" ? "video/*" : "image/*"}
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    controllerField.onChange(file ?? undefined);
                                }}
                            />
                            <FieldError errors={[linkFileError]} />
                        </div>
                    )}
                />
            )}
        </FieldContent>
    </Field>
);

const AboutPreValue = () => {
    const { get, update, getLoading, updateLoading } = useAboutStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const openPreview = usePreviewModalStore((state) => state.open);
    const preValueForm = useForm<AboutPreValueFormValues>({
        defaultValues: {
            title: ["", "", "", "", ""],
            description: "",
            linkType: "image",
            linkUrl: "",
            linkFile: undefined,
        },
        resolver: zodResolver(AboutPreValueZodSchema),
        mode: "onChange",
    });

    useEffect(() => {
        let isActive = true;
        preValueForm.reset({
            title: ["", "", "", "", ""],
            description: "",
            linkType: "image",
            linkUrl: "",
            linkFile: undefined,
        });
        preValueForm.clearErrors();

        const load = async () => {
            const result = await get("preValue") as AboutPayload["preValue"] | null;
            if (!isActive) return;
            if (!result) {
                preValueForm.reset({
                    title: ["", "", "", "", ""],
                    description: "",
                    linkType: "image",
                    linkUrl: "",
                    linkFile: undefined,
                });
                return;
            }
            const previousType = resolveLinkType(result.file?.contentType, result.file?.url);
            preValueForm.reset({
                title: result.title?.length === 5 ? result.title : ["", "", "", "", ""],
                description: result.description ?? "",
                linkType: previousType,
                linkUrl: result.file?.url ?? "",
                linkFile: undefined,
            });
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, preValueForm]);

    const onSubmit = async (formData: AboutPreValueFormValues) => {
        await update("preValue", formData);
    };

    const linkType = useWatch({ control: preValueForm.control, name: "linkType" });
    const linkFile = useWatch({ control: preValueForm.control, name: "linkFile" });
    const linkUrl = useWatch({ control: preValueForm.control, name: "linkUrl" });
    const descriptionValue = useWatch({ control: preValueForm.control, name: "description" });
    const linkUrlError = preValueForm.formState.errors.linkUrl;
    const linkFileError = preValueForm.formState.errors.linkFile;
    const savedValuesRef = useRef<Record<LinkTypeValue, { url?: string; file?: File }>>({
        image: {},
        video: {},
        link: {},
    });
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
        const restored = savedValuesRef.current[nextType] ?? {};
        preValueForm.setValue("linkUrl", restored.url ?? "", {
            shouldDirty: true,
            shouldValidate: false,
        });
        preValueForm.setValue("linkFile", restored.file ?? undefined, {
            shouldDirty: true,
            shouldValidate: false,
        });
        setTimeout(() => {
            void preValueForm.trigger("linkUrl");
            void preValueForm.trigger("linkFile");
        }, 0);
    };

    return (
        <FormProvider {...preValueForm}>
            {getLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={preValueForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <div className="space-y-1 text-white">
                        <h1 className="text-2xl font-semibold text-white">Pre Value</h1>
                        <p className="text-sm text-white/70">Add the pre-value title and description</p>
                    </div>
                    <FieldGroup className="grid gap-4 md:grid-cols-3">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Field key={`pre-value-title-${index}`}>
                                <FieldLabel htmlFor={`pre-value-title-${index}`} className="text-white/80">
                                    Title chunk {index + 1} <span className="text-white">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id={`pre-value-title-${index}`}
                                        placeholder={`Word ${index + 1}`}
                                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                        {...preValueForm.register(`title.${index}`)}
                                    />
                                    <FieldError errors={[preValueForm.formState.errors.title?.[index]]} />
                                </FieldContent>
                            </Field>
                        ))}
                    </FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="pre-value-description" className="text-white/80">
                            Description <span className="text-white">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <BasicRichEditor name="description" value={descriptionValue ?? ""} />
                            <FieldError errors={[preValueForm.formState.errors.description]} />
                        </FieldContent>
                    </Field>
                    <FieldGroup className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)] items-end">
                        <LinkTypeField
                            control={preValueForm.control}
                            resetField={preValueForm.resetField}
                            onChangeType={handleTypeChange}
                        />
                        <LinkTargetField
                            control={preValueForm.control}
                            register={preValueForm.register}
                            linkType={linkType}
                            linkUrl={linkUrl}
                            linkUrlError={linkUrlError}
                            linkFileError={linkFileError}
                            filePreviewUrl={filePreviewUrl}
                            onOpenPreview={() => {
                                if (!filePreviewUrl) {
                                    return;
                                }
                                openPreview({
                                    type: linkType ?? "image",
                                    url: filePreviewUrl,
                                    title: "Pre Value Preview",
                                });
                            }}
                        />
                    </FieldGroup>
                    <Button
                        type="submit"
                        className="w-full bg-white/90 text-black hover:bg-white"
                        disabled={getLoading || updateLoading || !preValueForm.formState.isValid}
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
                {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={`pre-value-title-skeleton-${index}`} className="h-10 w-full" />
                ))}
            </div>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    );
};

export default AboutPreValue;