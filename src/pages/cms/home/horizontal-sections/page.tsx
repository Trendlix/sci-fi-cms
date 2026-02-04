import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import BasicRichEditor from "@/components/tiptap/BasicRichEditor";
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
import { Link, Play } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeHorizontalStore } from "@/shared/hooks/store/home/useHomeHorizontalStore";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreviewModalStore } from "@/shared/hooks/store/ui/usePreviewModalStore";

export const HorizontalZodValidationSchema = z.object({
    sections: z.array(
        z.object({
            linkType: z.enum(["image", "video", "link"]),
            linkUrl: z.string().optional(),
            linkFile: z.any().optional(),
            title: z.array(z.string().min(1, "Title word is required")).length(2),
            slogan: z.string().min(3, "Slogan is required"),
            description: z.array(z.object({ value: z.string().min(1, "Description is required") })).min(1),
        })
    )
        .min(1)
        .superRefine((sections, ctx) => {
            sections.forEach((section, index) => {
                const trimmedUrl = section.linkUrl?.trim();
                if (section.linkType === "link" && !trimmedUrl) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Link URL is required",
                        path: ["sections", index, "linkUrl"],
                    });
                }

                if (section.linkType !== "link" && !section.linkFile && !trimmedUrl) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Upload file is required",
                        path: ["sections", index, "linkFile"],
                    });
                }
            });
        }),
})

type HorizontalFormValues = z.infer<typeof HorizontalZodValidationSchema>;

const defaultSections: HorizontalFormValues["sections"] = [
    {
        linkType: "image",
        linkUrl: "",
        linkFile: undefined,
        title: ["", ""],
        slogan: "",
        description: [{ value: "" }],
    },
];

type SectionFieldsProps = {
    index: number;
    control: Control<HorizontalFormValues>;
    register: UseFormRegister<HorizontalFormValues>;
    setValue: UseFormSetValue<HorizontalFormValues>;
    resetField: UseFormResetField<HorizontalFormValues>;
    errors: FieldErrors<HorizontalFormValues>;
    onRemove: () => void;
    canRemove: boolean;
    trigger: ReturnType<typeof useForm<HorizontalFormValues>>['trigger'];
};

type LinkTypeValue = "image" | "video" | "link" | undefined;

type SectionHeaderProps = {
    index: number;
    canRemove: boolean;
    onRemove: () => void;
};

const SectionHeader = ({ index, canRemove, onRemove }: SectionHeaderProps) => (
    <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Section {index + 1}</h2>
        <Button
            type="button"
            className="bg-white/10 text-white hover:bg-white/20"
            disabled={!canRemove}
            onClick={onRemove}
        >
            Remove section
        </Button>
    </div>
);

type LinkTypeFieldProps = {
    index: number;
    control: Control<HorizontalFormValues>;
    resetField: UseFormResetField<HorizontalFormValues>;
    onResetPreview: () => void;
    onChangeType: (nextType: LinkTypeValue) => void;
};

const LinkTypeField = ({
    index,
    control,
    resetField,
    onResetPreview,
    onChangeType,
}: LinkTypeFieldProps) => (
    <Field>
        <FieldLabel htmlFor={`link-type-${index}`} className="text-white/80">
            Type <span className="text-white">*</span>
        </FieldLabel>
        <FieldContent>
            <Controller
                control={control}
                name={`sections.${index}.linkType`}
                render={({ field: controllerField }) => (
                    <Select
                        value={controllerField.value}
                        onValueChange={(value) => {
                            controllerField.onChange(value);
                            resetField(`sections.${index}.linkFile`, { keepDirty: true });
                            resetField(`sections.${index}.linkUrl`, { keepDirty: true });
                            onChangeType(value as LinkTypeValue);
                            onResetPreview();
                        }}
                    >
                        <SelectTrigger
                            id={`link-type-${index}`}
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
    index: number;
    control: Control<HorizontalFormValues>;
    register: UseFormRegister<HorizontalFormValues>;
    linkType: LinkTypeValue;
    linkUrl?: string;
    linkUrlError?: FieldErrors<HorizontalFormValues>["sections"];
    linkFileError?: FieldErrors<HorizontalFormValues>["sections"];
    filePreviewUrl: string | null;
    onOpenPreview: () => void;
};

const LinkTargetField = ({
    index,
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
        <FieldLabel htmlFor={`link-input-${index}`} className="text-white/80">
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
                                    <Link size={16} />
                                </a>
                            ) : (
                                <Link size={16} />
                            )}
                        </InputGroupAddon>
                        <InputGroupInput
                            id={`link-input-${index}`}
                            key={`link-url-${index}-${linkType}`}
                            placeholder="Paste link (youtube...)"
                            className="text-white placeholder:text-white/40"
                            {...register(`sections.${index}.linkUrl`)}
                        />
                    </InputGroup>
                    <FieldError errors={[linkUrlError as { message?: string } | undefined]} />
                </div>
            ) : (
                <Controller
                    control={control}
                    name={`sections.${index}.linkFile`}
                    render={({ field: controllerField }) => (
                        <div className="flex items-center gap-3">
                            <label
                                htmlFor={`link-input-${index}`}
                                className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
                            >
                                {`Upload ${linkType ?? "image"}`}
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
                                id={`link-input-${index}`}
                                key={`link-file-${index}-${linkType}`}
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
);

type SectionTitlesProps = {
    index: number;
    register: UseFormRegister<HorizontalFormValues>;
    errors: FieldErrors<HorizontalFormValues>;
};

const SectionTitles = ({ index, register, errors }: SectionTitlesProps) => (
    <>
        {Array.from({ length: 2 }).map((_, titleIndex) => (
            <Field key={`title-${index}-${titleIndex}`}>
                <FieldLabel htmlFor={`title-${index}-${titleIndex}`} className="text-white/80">
                    Title word {titleIndex + 1} <span className="text-white">*</span>
                </FieldLabel>
                <FieldContent>
                    <Input
                        id={`title-${index}-${titleIndex}`}
                        placeholder={`Word ${titleIndex + 1}`}
                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                        {...register(`sections.${index}.title.${titleIndex}`)}
                    />
                    <FieldError errors={[errors?.sections?.[index]?.title?.[titleIndex]]} />
                </FieldContent>
            </Field>
        ))}
    </>
);

type SectionSloganProps = {
    index: number;
    register: UseFormRegister<HorizontalFormValues>;
    errors: FieldErrors<HorizontalFormValues>;
};

const SectionSlogan = ({ index, register, errors }: SectionSloganProps) => (
    <Field className="md:col-span-2">
        <FieldLabel htmlFor={`slogan-${index}`} className="text-white/80">
            Slogan <span className="text-white">*</span>
        </FieldLabel>
        <FieldContent>
            <Input
                id={`slogan-${index}`}
                placeholder="Enter slogan"
                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                {...register(`sections.${index}.slogan`)}
            />
            <FieldError errors={[errors?.sections?.[index]?.slogan]} />
        </FieldContent>
    </Field>
);

type DescriptionFieldsProps = {
    index: number;
    descriptionFields: ReturnType<typeof useFieldArray<HorizontalFormValues>>;
    errors: FieldErrors<HorizontalFormValues>;
    descriptionValues?: { value?: string }[];
};

const DescriptionFields = ({ index, descriptionFields, errors, descriptionValues }: DescriptionFieldsProps) => (
    <FieldGroup className="grid gap-4">
        {descriptionFields.fields.map((field, descriptionIndex) => (
            <Field key={field.id}>
                <FieldLabel htmlFor={`description-${index}-${descriptionIndex}`} className="text-white/80">
                    Description {descriptionIndex + 1} <span className="text-white">*</span>
                </FieldLabel>
                <FieldContent>
                    <BasicRichEditor
                        name={`sections.${index}.description.${descriptionIndex}.value`}
                        value={descriptionValues?.[descriptionIndex]?.value ?? ""}
                    />
                    <FieldError errors={[errors?.sections?.[index]?.description?.[descriptionIndex]?.value]} />
                </FieldContent>
                <div className="mt-2 flex justify-end">
                    <Button
                        type="button"
                        className="bg-white/10 text-white hover:bg-white/20"
                        disabled={descriptionFields.fields.length <= 1}
                        onClick={() => {
                            if (descriptionFields.fields.length <= 1) {
                                return;
                            }
                            descriptionFields.remove(descriptionIndex);
                        }}
                    >
                        Remove
                    </Button>
                </div>
            </Field>
        ))}
    </FieldGroup>
);

const SectionsSkeleton = ({ isRtl }: { isRtl: boolean }) => (
    <div className={cn("space-y-4", isRtl && "home-rtl")}>
        <CommonLanguageSwitcherCheckbox />
        <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
        </div>
        {Array.from({ length: 2 }).map((_, index) => (
            <div key={`horizontal-skeleton-${index}`} className="space-y-4 rounded-xl border border-white/15 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-8 w-28" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        ))}
        <Skeleton className="h-10 w-full" />
    </div>
);

const PageHeader = () => (
    <div className="space-y-1 text-white">
        <h1 className="text-xl font-semibold text-white">Horizontal Sections</h1>
        <p className="text-sm text-white/70">Add the title, slogan, and any number of descriptions</p>
    </div>
);

const SectionFields = ({ index, control, register, setValue, resetField, errors, onRemove, canRemove, trigger }: SectionFieldsProps) => {
    const openPreview = usePreviewModalStore((state) => state.open);
    const descriptionFields = useFieldArray({
        control,
        name: `sections.${index}.description`,
    });
    const descriptionValues = useWatch({
        control,
        name: `sections.${index}.description`,
    });
    const linkType = useWatch({
        control,
        name: `sections.${index}.linkType`,
    });
    const linkFile = useWatch({
        control,
        name: `sections.${index}.linkFile`,
    });
    const linkUrl = useWatch({
        control,
        name: `sections.${index}.linkUrl`,
    });
    const linkUrlError = errors?.sections?.[index]?.linkUrl;
    const linkFileError = errors?.sections?.[index]?.linkFile;
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
        setValue(`sections.${index}.linkUrl`, restored.url ?? "", {
            shouldDirty: true,
            shouldValidate: false
        });
        setValue(`sections.${index}.linkFile`, restored.file ?? undefined, {
            shouldDirty: true,
            shouldValidate: false
        });

        setTimeout(() => {
            trigger(`sections.${index}.linkUrl`);
            trigger(`sections.${index}.linkFile`);
        }, 0);
    };

    return (
        <div className="space-y-4 rounded-xl border border-white/15 bg-white/5 p-4">
            <SectionHeader index={index} canRemove={canRemove} onRemove={onRemove} />
            <FieldGroup className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)] items-end">
                <LinkTypeField
                    index={index}
                    control={control}
                    resetField={resetField}
                    onResetPreview={() => null}
                    onChangeType={handleTypeChange}
                />
                <LinkTargetField
                    index={index}
                    control={control}
                    register={register}
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
                            type: linkType === "link" ? "link" : linkType === "video" ? "video" : "image",
                            url: filePreviewUrl,
                            title: "Horizontal Section Preview",
                        });
                    }}
                />
            </FieldGroup>
            <FieldGroup className="grid gap-4 md:grid-cols-2">
                <SectionTitles index={index} register={register} errors={errors} />
                <SectionSlogan index={index} register={register} errors={errors} />
            </FieldGroup>
            <DescriptionFields
                index={index}
                descriptionFields={descriptionFields}
                errors={errors}
                descriptionValues={descriptionValues}
            />
            {descriptionFields.fields.length <= 1 ? (
                <p className="text-xs text-white/60">At least one description is required.</p>
            ) : null}
            <Button
                type="button"
                className="bg-white/10 text-white hover:bg-white/20"
                onClick={() => descriptionFields.append({ value: "" })}
            >
                Add description
            </Button>
        </div>
    );
};

const HorizontalSectionsPage = () => {
    const { data, get, update, getLoading, updateLoading } = useHomeHorizontalStore();
    const language = useHomeLanguageStore((state) => state.language);
    const horizontalData = data?.[language];
    const isRtl = language === "ar";
    const sectionsForm = useForm<HorizontalFormValues>({
        defaultValues: {
            sections: defaultSections,
        },
        resolver: zodResolver(HorizontalZodValidationSchema),
        mode: "onChange",
    })

    const sectionFields = useFieldArray({
        control: sectionsForm.control,
        name: "sections",
    })

    useEffect(() => {
        void get();
    }, [get, language, sectionsForm]);

    useEffect(() => {
        if (horizontalData === null || horizontalData === undefined) {
            return;
        }
        if (horizontalData.length === 0) {
            sectionsForm.reset({ sections: defaultSections });
        } else {
            sectionsForm.reset({
                sections: horizontalData.map((section) => ({
                    linkType: section.link.type === "external"
                        ? "link"
                        : section.link.contentType === "video"
                            ? "video"
                            : "image",
                    linkUrl: section.link.url ?? "",
                    linkFile: undefined,
                    title: section.title ?? ["", ""],
                    slogan: section.slogan ?? "",
                    description: (section.description ?? []).map((value) => ({ value })),
                })),
            });
        }
    }, [horizontalData, sectionsForm]);

    const onSubmit = async (data: HorizontalFormValues) => {
        const payload = data.sections.map((section) => ({
            linkType: section.linkType,
            linkUrl: section.linkUrl,
            linkFile: section.linkFile,
            title: section.title,
            slogan: section.slogan,
            description: section.description.map((item) => item.value),
        }));

        await update(payload);
    }

    return (
        <FormProvider {...sectionsForm}>
            {getLoading ? (
                <SectionsSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={sectionsForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <PageHeader />
                    <div className="space-y-6">
                        {sectionFields.fields.map((field, index) => (
                            <SectionFields
                                key={field.id}
                                index={index}
                                control={sectionsForm.control}
                                register={sectionsForm.register}
                                setValue={sectionsForm.setValue}
                                resetField={sectionsForm.resetField}
                                errors={sectionsForm.formState.errors}
                                onRemove={() => sectionFields.remove(index)}
                                canRemove={sectionFields.fields.length > 1}
                                trigger={sectionsForm.trigger}
                            />
                        ))}
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row">
                        <Button
                            type="button"
                            className="bg-white/10 text-white hover:bg-white/20 flex-1"
                            onClick={() =>
                                sectionFields.append({
                                    linkType: "image",
                                    linkUrl: "",
                                    linkFile: undefined,
                                    title: ["", ""],
                                    slogan: "",
                                    description: [{ value: "" }],
                                })
                            }
                        >
                            Add section
                        </Button>
                        <Button
                            type="submit"
                            className="bg-white/90 text-black hover:bg-white flex-4"
                            disabled={getLoading || updateLoading || !sectionsForm.formState.isValid}
                        >
                            {getLoading || updateLoading ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </form>
            )}
        </FormProvider>
    )
}

export default HorizontalSectionsPage;