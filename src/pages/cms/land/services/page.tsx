import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import BasicRichEditor from "@/components/tiptap/BasicRichEditor";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Controller,
    FormProvider,
    useFieldArray,
    useForm,
    useWatch,
    type Control,
    type FieldErrors,
    type UseFormRegister,
    type UseFormSetValue,
} from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useLandServicesBirthdayStore } from "@/shared/hooks/store/land/useLandServicesBirthdayStore";
import { usePreviewModalStore } from "@/shared/hooks/store/ui/usePreviewModalStore";
import type { LandFile } from "@/shared/hooks/store/land/land.types";
import { GripVertical, Link as LinkIcon, Play } from "lucide-react";

const listItemSchema = z.object({
    value: z.string().min(1, "Value is required"),
});
const descriptionListSchema = z.array(listItemSchema).min(1).max(3);
const highlightsListSchema = z.array(listItemSchema).min(3);
const diamondHighlightsListSchema = z.array(listItemSchema).min(3).max(80);

export const LandBirthdayZodSchema = z.object({
    price: z.number().min(1, "Price is required"),
    description: z.string().min(10, "Description is required"),
    files: z.array(
        z.object({
            linkType: z.enum(["image", "video", "link"]),
            linkUrl: z.string().optional(),
            linkFile: z.any().optional(),
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

            if (value.linkType !== "link" && !value.linkFile && !value.existing?.url) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Upload file is required",
                    path: ["linkFile"],
                });
            }
        })
    ).min(1, "At least one file is required"),
    packages: z.object({
        bronze: z.object({
            oldPrice: z.number().min(1),
            weekdays: z.number().min(1),
            weekends: z.number().min(1),
            descriptionList: descriptionListSchema,
            highlightsList: highlightsListSchema,
        }),
        gold: z.object({
            oldPrice: z.number().min(1),
            weekdays: z.number().min(1),
            weekends: z.number().min(1),
            descriptionList: descriptionListSchema,
            highlightsList: highlightsListSchema,
        }),
        diamond: z.object({
            oldPrice: z.number().min(1),
            price: z.number().min(1),
            descriptionList: descriptionListSchema,
            highlightsList: diamondHighlightsListSchema,
        }),
        prince: z.object({
            title: z.string().min(3),
            description: z.string().min(10),
        }),
    }),
});

type LandBirthdayFormValues = z.infer<typeof LandBirthdayZodSchema>;

const toList = (value: { value: string }[]) =>
    value.map((item) => item.value.trim()).filter(Boolean);

type BirthdayFileEntry = LandBirthdayFormValues["files"][number];

const defaultBirthdayFile: BirthdayFileEntry = {
    linkType: "image",
    linkUrl: "",
    linkFile: undefined,
    existing: undefined,
};

const defaultListItem = () => ({ value: "" });
const getEmptyBirthdayValues = (): LandBirthdayFormValues => ({
    price: 0,
    description: "",
    files: [defaultBirthdayFile],
    packages: {
        bronze: { oldPrice: 0, weekdays: 0, weekends: 0, descriptionList: [defaultListItem()], highlightsList: [defaultListItem()] },
        gold: { oldPrice: 0, weekdays: 0, weekends: 0, descriptionList: [defaultListItem()], highlightsList: [defaultListItem()] },
        diamond: { oldPrice: 0, price: 0, descriptionList: [defaultListItem()], highlightsList: [defaultListItem()] },
        prince: { title: "", description: "" },
    },
});

type LineListProps = {
    name: `packages.${"bronze" | "gold" | "diamond"}.${"descriptionList" | "highlightsList"}`;
    label: string;
    control: Control<LandBirthdayFormValues>;
    register: UseFormRegister<LandBirthdayFormValues>;
    errors: FieldErrors<LandBirthdayFormValues>;
};

const LineList = ({ name, label, control, register, errors }: LineListProps) => {
    const listFields = useFieldArray({
        control,
        name,
    });
    const [tier, fieldKey] = name.split(".").slice(1) as [
        "bronze" | "gold" | "diamond",
        "descriptionList" | "highlightsList"
    ];
    const fieldErrors = errors?.packages?.[tier]?.[fieldKey];
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <FieldLabel className="text-white/80">
                    {label} <span className="text-white">*</span>
                </FieldLabel>
                <Button
                    type="button"
                    className="bg-white/10 text-white hover:bg-white/20"
                    onClick={() => listFields.append(defaultListItem())}
                >
                    Add line
                </Button>
            </div>
            <div className="space-y-2">
                {listFields.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                        <Input
                            placeholder="Line"
                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                            {...register(`${name}.${index}.value` as const)}
                        />
                        <Button
                            type="button"
                            className="bg-white/10 text-white hover:bg-white/20"
                            disabled={listFields.fields.length <= 1}
                            onClick={() => listFields.remove(index)}
                        >
                            Remove
                        </Button>
                        <FieldError errors={[fieldErrors?.[index]?.value]} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const collectErrorMessages = (errors: Record<string, unknown>) => {
    const result: Array<{ path: string; message: string }> = [];
    const stack: Array<{ path: string; value: unknown }> = [{ path: "", value: errors }];

    while (stack.length > 0) {
        const current = stack.pop();
        if (!current || typeof current.value !== "object") {
            continue;
        }

        const record = current.value as Record<string, unknown>;
        if ("message" in record && typeof record.message === "string") {
            result.push({
                path: current.path || "form",
                message: record.message,
            });
        }

        for (const [key, value] of Object.entries(record)) {
            if (value && typeof value === "object") {
                const nextPath = current.path ? `${current.path}.${key}` : key;
                stack.push({ path: nextPath, value });
            }
        }
    }

    return result;
};

type BirthdayFileCardProps = {
    index: number;
    fieldId: string;
    item?: BirthdayFileEntry;
    control: Control<LandBirthdayFormValues>;
    register: UseFormRegister<LandBirthdayFormValues>;
    setValue: UseFormSetValue<LandBirthdayFormValues>;
    errors: FieldErrors<LandBirthdayFormValues>;
    canRemove: boolean;
    onRemove: () => void;
    onMove: (from: number, to: number) => void;
    onOpenPreview: (payload: { url: string; type: "image" | "video" | "link"; isObjectUrl: boolean }) => void;
};

const BirthdayFileCard = ({
    index,
    fieldId,
    item,
    control,
    register,
    setValue,
    errors,
    canRemove,
    onRemove,
    onMove,
    onOpenPreview,
}: BirthdayFileCardProps) => {
    const linkType = item?.linkType ?? "image";
    const linkUrl = item?.linkUrl ?? "";
    const existing = item?.existing;
    const linkFile = item?.linkFile instanceof FileList ? item.linkFile.item(0) : item?.linkFile;
    const linkUrlError = errors.files?.[index]?.linkUrl;
    const linkFileError = errors.files?.[index]?.linkFile;
    const filePreviewUrl = useMemo(() => {
        if (linkFile instanceof File) {
            return URL.createObjectURL(linkFile);
        }
        if (typeof linkUrl === "string" && linkUrl.length > 0) {
            return linkUrl;
        }
        if (existing?.url) {
            return existing.url;
        }
        return null;
    }, [linkFile, linkUrl, existing?.url]);

    useEffect(() => {
        if (!filePreviewUrl) {
            return undefined;
        }
        if (linkFile instanceof File) {
            return () => URL.revokeObjectURL(filePreviewUrl);
        }
        return undefined;
    }, [filePreviewUrl, linkFile]);


    return (
        <div
            key={fieldId}
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
            className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-white/70">
                    <GripVertical className="h-3 w-3" />
                    Drag
                </div>
                <Button
                    type="button"
                    className="bg-white/10 text-white hover:bg-white/20"
                    disabled={!canRemove}
                    onClick={onRemove}
                >
                    Remove
                </Button>
            </div>
            <FieldGroup className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <Field>
                    <FieldLabel className="text-white/80">Type</FieldLabel>
                    <FieldContent>
                        <Controller
                            control={control}
                            name={`files.${index}.linkType`}
                            render={({ field: controllerField }) => (
                                <Select
                                    value={controllerField.value}
                                    onValueChange={(value) => {
                                        controllerField.onChange(value);
                                        if (value === "link") {
                                            setValue(`files.${index}.linkFile`, undefined, { shouldDirty: true });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full border-white/20 bg-white/5 text-white focus-visible:border-white/40">
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
                <div>
                    {linkType === "link" ? (
                        <Field className="md:col-span-2">
                            <FieldLabel className="text-white/80">
                                Paste link <span className="text-white">*</span>
                            </FieldLabel>
                            <FieldContent>
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
                                            id={`link-input-${index}`}
                                            key={`link-url-${index}-${linkType}`}
                                            placeholder="Paste link (youtube...)"
                                            className="text-white placeholder:text-white/40"
                                            {...register(`files.${index}.linkUrl`)}
                                        />
                                    </InputGroup>
                                    <FieldError errors={[linkUrlError as { message?: string } | undefined]} />
                                </div>
                            </FieldContent>
                        </Field>
                    ) : (
                        <Field className="md:col-span-2">
                            <FieldLabel className="text-white/80">
                                {`Upload ${linkType ?? "image"}`} <span className="text-white">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <Controller
                                    control={control}
                                    name={`files.${index}.linkFile`}
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
                                                    onClick={() => {
                                                        if (!filePreviewUrl) {
                                                            return;
                                                        }
                                                        onOpenPreview({
                                                            type: linkType === "video" ? "video" : "image",
                                                            url: filePreviewUrl,
                                                            isObjectUrl: linkFile instanceof File,
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
                                            ) : filePreviewUrl ? (
                                                <button
                                                    type="button"
                                                    className="flex items-center gap-2 text-xs text-white/80"
                                                    onClick={() => {
                                                        if (!filePreviewUrl) {
                                                            return;
                                                        }
                                                        onOpenPreview({
                                                            type: linkType === "video" ? "video" : "image",
                                                            url: filePreviewUrl,
                                                            isObjectUrl: linkFile instanceof File,
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
                            </FieldContent>
                        </Field>
                    )}
                    {linkType === "link" ? (
                        <Field className="md:col-span-2">
                            <FieldLabel className="text-white/80">Preview</FieldLabel>
                            <FieldContent>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!filePreviewUrl) {
                                            return;
                                        }
                                        onOpenPreview({ url: filePreviewUrl, type: "link", isObjectUrl: false });
                                    }}
                                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-left text-xs text-white/70 hover:bg-white/10"
                                >
                                    <span className="truncate">
                                        {linkUrl || existing?.url || "No link"}
                                    </span>
                                    <LinkIcon className="h-4 w-4" />
                                </button>
                            </FieldContent>
                        </Field>
                    ) : null}
                </div>
            </FieldGroup>
        </div>
    );
};

const LandBirthdayService = () => {
    const { data, get, update, getLoading, updateLoading } = useLandServicesBirthdayStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const currentData = data?.[language] ?? null;
    const { open: openPreview } = usePreviewModalStore();
    const hasInitialized = useRef(false);
    const form = useForm<LandBirthdayFormValues>({
        defaultValues: getEmptyBirthdayValues(),
        resolver: zodResolver(LandBirthdayZodSchema),
        mode: "onChange",
    });
    const descriptionValue = useWatch({ control: form.control, name: "description" });
    const packageDescriptionValue = useWatch({
        control: form.control,
        name: "packages.prince.description",
    });

    useEffect(() => {
        hasInitialized.current = false;
        void get();
    }, [get, language]);

    useEffect(() => {
        if (currentData === null || hasInitialized.current) {
            return;
        }
        const toFileEntry = (file?: LandFile): BirthdayFileEntry => ({
            linkType: file?.contentType === "video" ? "video" : file?.contentType === "link" ? "link" : "image",
            linkUrl: file?.contentType === "link" ? file?.url ?? "" : "",
            linkFile: undefined,
            existing: file,
        });
        form.reset({
            price: currentData.price ?? 0,
            description: currentData.description ?? "",
            files: currentData.files?.length ? currentData.files.map(toFileEntry) : [defaultBirthdayFile],
            packages: {
                bronze: {
                    oldPrice: currentData.packages.bronze.oldPrice ?? 0,
                    weekdays: currentData.packages.bronze.price.weekdays ?? 0,
                    weekends: currentData.packages.bronze.price.weekends ?? 0,
                    descriptionList: (currentData.packages.bronze.description ?? []).map((value) => ({ value })),
                    highlightsList: (currentData.packages.bronze.highlights ?? []).map((value) => ({ value })),
                },
                gold: {
                    oldPrice: currentData.packages.gold.oldPrice ?? 0,
                    weekdays: currentData.packages.gold.price.weekdays ?? 0,
                    weekends: currentData.packages.gold.price.weekends ?? 0,
                    descriptionList: (currentData.packages.gold.description ?? []).map((value) => ({ value })),
                    highlightsList: (currentData.packages.gold.highlights ?? []).map((value) => ({ value })),
                },
                diamond: {
                    oldPrice: currentData.packages.diamond.oldPrice ?? 0,
                    price: currentData.packages.diamond.price ?? 0,
                    descriptionList: (currentData.packages.diamond.description ?? []).map((value) => ({ value })),
                    highlightsList: (currentData.packages.diamond.highlights ?? []).map((value) => ({ value })),
                },
                prince: {
                    title: currentData.packages.prince.title ?? "",
                    description: currentData.packages.prince.description ?? "",
                },
            },
        });
        hasInitialized.current = true;
    }, [currentData, form]);

    const filesArray = useFieldArray({
        control: form.control,
        name: "files",
    });
    const watchedFiles = useWatch({ control: form.control, name: "files" });

    const onSubmit = async (values: LandBirthdayFormValues) => {
        await update({
            price: values.price,
            description: values.description,
            files: values.files,
            packages: {
                bronze: {
                    oldPrice: values.packages.bronze.oldPrice,
                    price: {
                        weekdays: values.packages.bronze.weekdays,
                        weekends: values.packages.bronze.weekends,
                    },
                    description: toList(values.packages.bronze.descriptionList),
                    highlights: toList(values.packages.bronze.highlightsList),
                },
                gold: {
                    oldPrice: values.packages.gold.oldPrice,
                    price: {
                        weekdays: values.packages.gold.weekdays,
                        weekends: values.packages.gold.weekends,
                    },
                    description: toList(values.packages.gold.descriptionList),
                    highlights: toList(values.packages.gold.highlightsList),
                },
                diamond: {
                    oldPrice: values.packages.diamond.oldPrice,
                    price: values.packages.diamond.price,
                    description: toList(values.packages.diamond.descriptionList),
                    highlights: toList(values.packages.diamond.highlightsList),
                },
                prince: {
                    title: values.packages.prince.title,
                    description: values.packages.prince.description,
                },
            },
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
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                <CommonLanguageSwitcherCheckbox />
                <div className="space-y-1 text-white">
                    <h1 className="text-2xl font-semibold text-white">Birthday Party</h1>
                    <p className="text-sm text-white/70">Add birthday party service details</p>
                </div>
                <FieldGroup className={cn("grid gap-4 md:grid-cols-2", "bg-white/5 rounded-2xl p-4")}>
                    <Field>
                        <FieldLabel htmlFor="birthday-price" className="text-white/80">
                            Price <span className="text-white">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                id="birthday-price"
                                type="number"
                                min={0}
                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                {...form.register("price", { valueAsNumber: true })}
                            />
                            <FieldError errors={[form.formState.errors.price]} />
                        </FieldContent>
                    </Field>
                    <Field className="md:col-span-2">
                        <FieldLabel htmlFor="birthday-description" className="text-white/80">
                            Description <span className="text-white">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <BasicRichEditor name="description" value={descriptionValue ?? ""} />
                            <FieldError errors={[form.formState.errors.description]} />
                        </FieldContent>
                    </Field>
                    <Field className="md:col-span-2">
                        <FieldLabel className="text-white/80">
                            Files <span className="text-white">*</span>
                        </FieldLabel>
                        <div className="space-y-3">
                            {filesArray.fields.map((field, index) => (
                                <BirthdayFileCard
                                    key={field.id}
                                    fieldId={field.id}
                                    index={index}
                                    item={watchedFiles?.[index]}
                                    control={form.control}
                                    register={form.register}
                                    setValue={form.setValue}
                                    errors={form.formState.errors}
                                    canRemove={filesArray.fields.length > 1}
                                    onRemove={() => filesArray.remove(index)}
                                    onMove={filesArray.move}
                                    onOpenPreview={openPreview}
                                />
                            ))}
                            <Button
                                type="button"
                                className="bg-white/10 text-white hover:bg-white/20"
                                onClick={() => filesArray.append({ ...defaultBirthdayFile })}
                            >
                                Add file
                            </Button>
                        </div>
                    </Field>
                </FieldGroup>

                <div className={cn("space-y-4 bg-white/5 rounded-2xl p-4")}>
                    {(["bronze", "gold"] as const).map((tier) => (
                        <div key={tier} className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
                            <h2 className="text-lg font-semibold text-white capitalize">{tier} package</h2>
                            <FieldGroup className="grid gap-4 md:grid-cols-3">
                                <Field>
                                    <FieldLabel htmlFor={`${tier}-old-price`} className="text-white/80">
                                        Old price <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`${tier}-old-price`}
                                            type="number"
                                            min={0}
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...form.register(`packages.${tier}.oldPrice`, { valueAsNumber: true })}
                                        />
                                        <FieldError errors={[form.formState.errors.packages?.[tier]?.oldPrice]} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor={`${tier}-weekdays`} className="text-white/80">
                                        Weekdays Price <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`${tier}-weekdays`}
                                            type="number"
                                            min={0}
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...form.register(`packages.${tier}.weekdays`, { valueAsNumber: true })}
                                        />
                                        <FieldError errors={[form.formState.errors.packages?.[tier]?.weekdays]} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor={`${tier}-weekends`} className="text-white/80">
                                        Weekends Price <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`${tier}-weekends`}
                                            type="number"
                                            min={0}
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...form.register(`packages.${tier}.weekends`, { valueAsNumber: true })}
                                        />
                                        <FieldError errors={[form.formState.errors.packages?.[tier]?.weekends]} />
                                    </FieldContent>
                                </Field>
                                <Field className="md:col-span-3">
                                    <LineList
                                        name={`packages.${tier}.descriptionList`}
                                        label="Description list"
                                        control={form.control}
                                        register={form.register}
                                        errors={form.formState.errors}
                                    />
                                </Field>
                                <Field className="md:col-span-3">
                                    <LineList
                                        name={`packages.${tier}.highlightsList`}
                                        label="Highlights list"
                                        control={form.control}
                                        register={form.register}
                                        errors={form.formState.errors}
                                    />
                                </Field>
                            </FieldGroup>
                        </div>
                    ))}

                    <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
                        <h2 className="text-lg font-semibold text-white">Diamond package</h2>
                        <FieldGroup className="grid gap-4 md:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="diamond-old-price" className="text-white/80">
                                    Old price <span className="text-white">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="diamond-old-price"
                                        type="number"
                                        min={0}
                                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                        {...form.register("packages.diamond.oldPrice", { valueAsNumber: true })}
                                    />
                                    <FieldError errors={[form.formState.errors.packages?.diamond?.oldPrice]} />
                                </FieldContent>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="diamond-price" className="text-white/80">
                                    Price <span className="text-white">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="diamond-price"
                                        type="number"
                                        min={0}
                                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                        {...form.register("packages.diamond.price", { valueAsNumber: true })}
                                    />
                                    <FieldError errors={[form.formState.errors.packages?.diamond?.price]} />
                                </FieldContent>
                            </Field>
                            <Field className="md:col-span-3">
                                <LineList
                                    name="packages.diamond.descriptionList"
                                    label="Description list"
                                    control={form.control}
                                    register={form.register}
                                    errors={form.formState.errors}
                                />
                            </Field>
                            <Field className="md:col-span-3">
                                <LineList
                                    name="packages.diamond.highlightsList"
                                    label="Highlights list"
                                    control={form.control}
                                    register={form.register}
                                    errors={form.formState.errors}
                                />
                            </Field>
                        </FieldGroup>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
                        <h2 className="text-lg font-semibold text-white">Prince package</h2>
                        <FieldGroup className="grid gap-4 md:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="prince-title" className="text-white/80">
                                    Title <span className="text-white">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="prince-title"
                                        placeholder="Title"
                                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                        {...form.register("packages.prince.title")}
                                    />
                                    <FieldError errors={[form.formState.errors.packages?.prince?.title]} />
                                </FieldContent>
                            </Field>
                            <Field className="md:col-span-2">
                                <FieldLabel htmlFor="prince-description" className="text-white/80">
                                    Description <span className="text-white">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <BasicRichEditor
                                        name="packages.prince.description"
                                        value={packageDescriptionValue ?? ""}
                                    />
                                    <FieldError errors={[form.formState.errors.packages?.prince?.description]} />
                                </FieldContent>
                            </Field>
                        </FieldGroup>
                    </div>
                </div>
                {!form.formState.isValid ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        <p className="font-semibold">Fix the highlighted fields:</p>
                        <ul className="mt-2 space-y-1">
                            {collectErrorMessages(form.formState.errors as Record<string, unknown>)
                                .slice(0, 8)
                                .map((item) => (
                                    <li key={`${item.path}-${item.message}`}>
                                        <span className="font-medium">{item.path}:</span> {item.message}
                                    </li>
                                ))}
                        </ul>
                    </div>
                ) : null}
                <Button
                    type="submit"
                    className="w-full bg-white/90 text-black hover:bg-white"
                    disabled={getLoading || updateLoading || !form.formState.isValid}
                >
                    {updateLoading ? "Saving..." : "Save"}
                </Button>
            </form>
        </FormProvider>
    );
};

export default LandBirthdayService;