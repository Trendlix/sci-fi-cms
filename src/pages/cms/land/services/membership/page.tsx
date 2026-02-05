import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
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
import { useEffect, useMemo } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useLandServicesMembershipStore } from "@/shared/hooks/store/land/useLandServicesMembershipStore";
import { usePreviewModalStore } from "@/shared/hooks/store/ui/usePreviewModalStore";
import type { LandFile } from "@/shared/hooks/store/land/land.types";
import { GripVertical, Link as LinkIcon, Play } from "lucide-react";

const listSchema = z.string().min(1, "List is required");

const membershipCardSchema = z.object({
    icon: z.string().min(1),
    title: z.string().min(3),
    perMonthIcon: z.string().min(1),
    perMonthHighlightNo: z.number().min(1),
    perMonthHighlightLine: z.string().min(3),
    perWeekIcon: z.string().min(1),
    perWeekHighlightNo: z.number().min(1),
    perWeekHighlightLine: z.string().min(3),
    perSessionIcon: z.string().min(1),
    perSessionHighlightNo: z.number().min(1),
    perSessionHighlightLine: z.string().min(3),
    totalTimeIcon: z.string().min(1),
    totalTimeLine: z.string().min(3),
    oldPricePerMonth: z.number().min(1),
    pricePerMonth: z.number().min(1),
    highlightsList: listSchema,
    isPopular: z.boolean(),
});

export const LandMembershipZodSchema = z.object({
    price: z.number().min(1),
    description: z.string().min(10),
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
        description: z.string().min(10),
        years: z.object({
            "3": membershipCardSchema,
            "6": membershipCardSchema,
        }),
    }),
});

type LandMembershipFormValues = z.infer<typeof LandMembershipZodSchema>;

const toList = (value: string) =>
    value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

const defaultCard = (): LandMembershipFormValues["packages"]["years"]["3"] => ({
    icon: "",
    title: "",
    perMonthIcon: "",
    perMonthHighlightNo: 0,
    perMonthHighlightLine: "",
    perWeekIcon: "",
    perWeekHighlightNo: 0,
    perWeekHighlightLine: "",
    perSessionIcon: "",
    perSessionHighlightNo: 0,
    perSessionHighlightLine: "",
    totalTimeIcon: "",
    totalTimeLine: "",
    oldPricePerMonth: 0,
    pricePerMonth: 0,
    highlightsList: "",
    isPopular: false,
});

type MembershipFileEntry = LandMembershipFormValues["files"][number];

const defaultMembershipFile: MembershipFileEntry = {
    linkType: "image",
    linkUrl: "",
    linkFile: undefined,
    existing: undefined,
};
const getEmptyMembershipValues = (): LandMembershipFormValues => ({
    price: 0,
    description: "",
    files: [defaultMembershipFile],
    packages: {
        description: "",
        years: {
            "3": defaultCard(),
            "6": defaultCard(),
        },
    },
});

type MembershipFileCardProps = {
    index: number;
    fieldId: string;
    item?: MembershipFileEntry;
    control: Control<LandMembershipFormValues>;
    register: UseFormRegister<LandMembershipFormValues>;
    setValue: UseFormSetValue<LandMembershipFormValues>;
    errors: FieldErrors<LandMembershipFormValues>;
    canRemove: boolean;
    onRemove: () => void;
    onMove: (from: number, to: number) => void;
    onOpenPreview: (payload: { url: string; type: "image" | "video" | "link"; isObjectUrl: boolean }) => void;
};

const MembershipFileCard = ({
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
}: MembershipFileCardProps) => {
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
            <FieldGroup className="grid gap-4 md:grid-cols-2">
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
                                    <span className="truncate">{linkUrl || existing?.url || "No link"}</span>
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

const LandMembershipService = () => {
    const { get, update, getLoading, updateLoading } = useLandServicesMembershipStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const { open: openPreview } = usePreviewModalStore();
    const form = useForm<LandMembershipFormValues>({
        defaultValues: getEmptyMembershipValues(),
        resolver: zodResolver(LandMembershipZodSchema),
        mode: "onChange",
    });
    const descriptionValue = useWatch({ control: form.control, name: "description" });
    const packagesDescriptionValue = useWatch({ control: form.control, name: "packages.description" });

    useEffect(() => {
        let isActive = true;
        form.reset(getEmptyMembershipValues());
        form.clearErrors();

        const load = async () => {
            const result = await get().catch(() => null);
            if (!isActive) return;
            if (!result) {
                form.reset(getEmptyMembershipValues());
                return;
            }
            const toFileEntry = (file?: LandFile): MembershipFileEntry => ({
                linkType: file?.contentType === "video" ? "video" : file?.contentType === "link" ? "link" : "image",
                linkUrl: file?.contentType === "link" ? file?.url ?? "" : "",
                linkFile: undefined,
                existing: file,
            });
            const normalizeCard = (card: typeof result.packages.years[3]) => ({
                icon: card.icon ?? "",
                title: card.title ?? "",
                perMonthIcon: card.hours.perMonth.icon ?? "",
                perMonthHighlightNo: card.hours.perMonth.highlight.no ?? 0,
                perMonthHighlightLine: card.hours.perMonth.highlight.line ?? "",
                perWeekIcon: card.hours.perWeek.icon ?? "",
                perWeekHighlightNo: card.hours.perWeek.highlight.no ?? 0,
                perWeekHighlightLine: card.hours.perWeek.highlight.line ?? "",
                perSessionIcon: card.hours.perSession.icon ?? "",
                perSessionHighlightNo: card.hours.perSession.highlight.no ?? 0,
                perSessionHighlightLine: card.hours.perSession.highlight.line ?? "",
                totalTimeIcon: card.hours.totalTime.icon ?? "",
                totalTimeLine: card.hours.totalTime.line ?? "",
                oldPricePerMonth: card.oldPricePerMonth ?? 0,
                pricePerMonth: card.pricePerMonth ?? 0,
                highlightsList: (card.highlights ?? []).join("\n"),
                isPopular: Boolean(card.isPopular),
            });

            form.reset({
                price: result.price ?? 0,
                description: result.description ?? "",
                files: result.files?.length ? result.files.map(toFileEntry) : [defaultMembershipFile],
                packages: {
                    description: result.packages.description ?? "",
                    years: {
                        "3": normalizeCard(result.packages.years[3]),
                        "6": normalizeCard(result.packages.years[6]),
                    },
                },
            });
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, form]);

    const filesArray = useFieldArray({
        control: form.control,
        name: "files",
    });
    const watchedFiles = useWatch({ control: form.control, name: "files" });

    const onSubmit = async (values: LandMembershipFormValues) => {
        const toCardPayload = (card: LandMembershipFormValues["packages"]["years"]["3"]) => ({
            icon: card.icon,
            title: card.title,
            hours: {
                perMonth: {
                    icon: card.perMonthIcon,
                    highlight: {
                        no: card.perMonthHighlightNo,
                        line: card.perMonthHighlightLine,
                    },
                },
                perWeek: {
                    icon: card.perWeekIcon,
                    highlight: {
                        no: card.perWeekHighlightNo,
                        line: card.perWeekHighlightLine,
                    },
                },
                perSession: {
                    icon: card.perSessionIcon,
                    highlight: {
                        no: card.perSessionHighlightNo,
                        line: card.perSessionHighlightLine,
                    },
                },
                totalTime: {
                    icon: card.totalTimeIcon,
                    line: card.totalTimeLine,
                },
            },
            oldPricePerMonth: card.oldPricePerMonth,
            pricePerMonth: card.pricePerMonth,
            highlights: toList(card.highlightsList),
            isPopular: card.isPopular,
        });

        await update({
            price: values.price,
            description: values.description,
            files: values.files,
            packages: {
                description: values.packages.description,
                years: {
                    3: toCardPayload(values.packages.years["3"]),
                    6: toCardPayload(values.packages.years["6"]),
                },
            },
        });
    };

    const renderYearCard = (year: "3" | "6") => (
        <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
            <h2 className="text-lg font-semibold text-white">Year {Number(year)}</h2>
            <FieldGroup className="grid gap-4 md:grid-cols-2">
                <Field>
                    <FieldLabel htmlFor={`year-${year}-icon`} className="text-white/80">
                        Icon <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <Input
                            id={`year-${year}-icon`}
                            placeholder="Icon"
                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                            {...form.register(`packages.years.${year}.icon` as const)}
                        />
                        <FieldError errors={[form.formState.errors.packages?.years?.[year]?.icon]} />
                    </FieldContent>
                </Field>
                <Field>
                    <FieldLabel htmlFor={`year-${year}-title`} className="text-white/80">
                        Title <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <Input
                            id={`year-${year}-title`}
                            placeholder="Title"
                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                            {...form.register(`packages.years.${year}.title` as const)}
                        />
                        <FieldError errors={[form.formState.errors.packages?.years?.[year]?.title]} />
                    </FieldContent>
                </Field>
                <Field>
                    <FieldLabel htmlFor={`year-${year}-old-price`} className="text-white/80">
                        Old price/month <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <Input
                            id={`year-${year}-old-price`}
                            type="number"
                            min={0}
                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                            {...form.register(`packages.years.${year}.oldPricePerMonth` as const, { valueAsNumber: true })}
                        />
                        <FieldError errors={[form.formState.errors.packages?.years?.[year]?.oldPricePerMonth]} />
                    </FieldContent>
                </Field>
                <Field>
                    <FieldLabel htmlFor={`year-${year}-price`} className="text-white/80">
                        Price/month <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <Input
                            id={`year-${year}-price`}
                            type="number"
                            min={0}
                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                            {...form.register(`packages.years.${year}.pricePerMonth` as const, { valueAsNumber: true })}
                        />
                        <FieldError errors={[form.formState.errors.packages?.years?.[year]?.pricePerMonth]} />
                    </FieldContent>
                </Field>
                <Field className="md:col-span-2">
                    <FieldLabel htmlFor={`year-${year}-highlights`} className="text-white/80">
                        Highlights list <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <Textarea
                            id={`year-${year}-highlights`}
                            placeholder="One item per line"
                            className="min-h-24 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                            {...form.register(`packages.years.${year}.highlightsList` as const)}
                        />
                        <FieldError errors={[form.formState.errors.packages?.years?.[year]?.highlightsList]} />
                    </FieldContent>
                </Field>
                <Field className="md:col-span-2">
                    <FieldLabel className="text-white/80">Hours details</FieldLabel>
                    <FieldGroup className="grid gap-4 md:grid-cols-2">
                        {([
                            ["perMonth", "Per Month"],
                            ["perWeek", "Per Week"],
                            ["perSession", "Per Session"],
                            ["totalTime", "Total Time"],
                        ] as const).map(([key, label]) => (
                            <div key={key} className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                                <p className="text-sm text-white/70">{label}</p>
                                <Input
                                    placeholder="Icon"
                                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                    {...form.register(
                                        key === "totalTime"
                                            ? (`packages.years.${year}.totalTimeIcon` as const)
                                            : (`packages.years.${year}.${key}Icon` as const)
                                    )}
                                />
                                {key !== "totalTime" ? (
                                    <>
                                        <Input
                                            type="number"
                                            min={0}
                                            placeholder="Highlight no"
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...form.register(
                                                `packages.years.${year}.${key}HighlightNo` as const,
                                                { valueAsNumber: true }
                                            )}
                                        />
                                        <Input
                                            placeholder="Highlight line"
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...form.register(`packages.years.${year}.${key}HighlightLine` as const)}
                                        />
                                    </>
                                ) : (
                                    <Input
                                        placeholder="Line"
                                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                        {...form.register(`packages.years.${year}.totalTimeLine` as const)}
                                    />
                                )}
                            </div>
                        ))}
                    </FieldGroup>
                </Field>
                <Field className="md:col-span-2">
                    <FieldLabel className="text-white/80">Is popular</FieldLabel>
                    <FieldContent>
                        <input
                            type="checkbox"
                            className="h-4 w-4 accent-white"
                            {...form.register(`packages.years.${year}.isPopular` as const)}
                        />
                    </FieldContent>
                </Field>
            </FieldGroup>
        </div>
    );

    return (
        <FormProvider {...form}>
            {getLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <div className="space-y-1 text-white">
                        <h1 className="text-2xl font-semibold text-white">Membership Packages</h1>
                        <p className="text-sm text-white/70">Add membership packages details</p>
                    </div>
                    <FieldGroup className="grid gap-4 md:grid-cols-2">
                        <Field>
                            <FieldLabel htmlFor="membership-price" className="text-white/80">
                                Price <span className="text-white">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    id="membership-price"
                                    type="number"
                                    min={0}
                                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                    {...form.register("price", { valueAsNumber: true })}
                                />
                                <FieldError errors={[form.formState.errors.price]} />
                            </FieldContent>
                        </Field>
                        <Field className="md:col-span-2">
                            <FieldLabel className="text-white/80">
                                Files <span className="text-white">*</span>
                            </FieldLabel>
                            <div className="space-y-3">
                                {filesArray.fields.map((field, index) => (
                                    <MembershipFileCard
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
                                    onClick={() => filesArray.append({ ...defaultMembershipFile })}
                                >
                                    Add file
                                </Button>
                            </div>
                        </Field>
                        <Field className="md:col-span-2">
                            <FieldLabel htmlFor="membership-description" className="text-white/80">
                                Description <span className="text-white">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <BasicRichEditor name="description" value={descriptionValue ?? ""} />
                                <FieldError errors={[form.formState.errors.description]} />
                            </FieldContent>
                        </Field>
                        <Field className="md:col-span-2">
                            <FieldLabel htmlFor="membership-package-description" className="text-white/80">
                                Packages description <span className="text-white">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <BasicRichEditor
                                    name="packages.description"
                                    value={packagesDescriptionValue ?? ""}
                                />
                                <FieldError errors={[form.formState.errors.packages?.description]} />
                            </FieldContent>
                        </Field>
                    </FieldGroup>
                    {renderYearCard("3")}
                    {renderYearCard("6")}
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
            <Skeleton className="h-10 w-full" />
        </div>
    );
};

export default LandMembershipService;

