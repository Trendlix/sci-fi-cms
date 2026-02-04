import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useLandServicesWalkinStore } from "@/shared/hooks/store/land/useLandServicesWalkinStore";
import { Upload } from "lucide-react";
import type { LandWalkinPayload } from "@/shared/hooks/store/land/land.types";

const fileSchema = z.any().refine((file) => !file || file instanceof File, {
    message: "File must be a file",
});

const walkinCardSchema = z.object({
    icon: z.string().min(1),
    title: z.string().min(3),
    description: z.string().min(10),
});

const walkinHighlightCardSchema = z.object({
    icon: z.string().min(1),
    title: z.string().min(3),
    highlightsList: z.string().min(1),
});

const joinerFileSchema = z.object({
    tag: z.string().min(3),
    fileFile: fileSchema.optional(),
    existing: z.object({
        url: z.string().optional(),
        path: z.string().optional(),
        contentType: z.string().optional(),
        uploadedAt: z.string().optional(),
    }).optional(),
});

export const LandWalkinZodSchema = z.object({
    firstCards: z.array(walkinCardSchema).min(1),
    lastCards: z.array(walkinHighlightCardSchema).min(1),
    joinerFloor: z.object({
        description: z.array(z.string().min(1)).length(2),
        files: z.array(joinerFileSchema).min(1),
    }),
    geniusFloor: z.object({
        description: z.array(z.string().min(1)).length(2),
        files: z.array(joinerFileSchema).min(1),
    }),
});

type LandWalkinFormValues = z.infer<typeof LandWalkinZodSchema>;

const defaultFirstCard: LandWalkinFormValues["firstCards"][number] = {
    icon: "",
    title: "",
    description: "",
};

const defaultLastCard: LandWalkinFormValues["lastCards"][number] = {
    icon: "",
    title: "",
    highlightsList: "",
};

const defaultJoinerFile: LandWalkinFormValues["joinerFloor"]["files"][number] = {
    tag: "",
    fileFile: undefined,
    existing: undefined,
};
const getEmptyWalkinValues = (): LandWalkinFormValues => ({
    firstCards: [defaultFirstCard],
    lastCards: [defaultLastCard],
    joinerFloor: {
        description: ["", ""],
        files: [defaultJoinerFile],
    },
    geniusFloor: {
        description: ["", ""],
        files: [defaultJoinerFile],
    },
});

type JoinerFileUploaderProps = {
    control: ReturnType<typeof useForm<LandWalkinFormValues>>["control"];
    name: `joinerFloor.files.${number}.fileFile` | `geniusFloor.files.${number}.fileFile`;
    inputId: string;
    existingUrl?: string;
};

const JoinerFileUploader = ({ control, name, inputId, existingUrl }: JoinerFileUploaderProps) => {
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
                                alt="File preview"
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        ) : (
                            <>
                                <Upload size={18} className="text-white/70" />
                                <span className="text-center">Upload</span>
                            </>
                        )}
                    </label>
                    <span className="text-xs text-white/60">
                        {controllerField.value instanceof File
                            ? controllerField.value.name
                            : existingUrl
                                ? "Current file"
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

const toList = (value: string) =>
    value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

const LandWalkinService = () => {
    const { get, update, getLoading, updateLoading } = useLandServicesWalkinStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const [currentData, setCurrentData] = useState<LandWalkinPayload | null>(null);
    const form = useForm<LandWalkinFormValues>({
        defaultValues: getEmptyWalkinValues(),
        resolver: zodResolver(LandWalkinZodSchema),
        mode: "onChange",
    });
    const firstCardsValue = useWatch({ control: form.control, name: "firstCards" });
    const joinerDescriptions = useWatch({ control: form.control, name: "joinerFloor.description" });
    const geniusDescriptions = useWatch({ control: form.control, name: "geniusFloor.description" });

    const firstCards = useFieldArray({
        control: form.control,
        name: "firstCards",
    });
    const lastCards = useFieldArray({
        control: form.control,
        name: "lastCards",
    });
    const joinerFiles = useFieldArray({
        control: form.control,
        name: "joinerFloor.files",
    });
    const geniusFiles = useFieldArray({
        control: form.control,
        name: "geniusFloor.files",
    });

    useEffect(() => {
        let isActive = true;
        form.reset(getEmptyWalkinValues());
        form.clearErrors();

        const load = async () => {
            const result = await get().catch(() => null);
            if (!isActive) return;
            setCurrentData(result ?? null);
            if (!result) {
                form.reset(getEmptyWalkinValues());
                return;
            }
            form.reset({
                firstCards: result.firstCards.map((card) => ({
                    icon: card.icon ?? "",
                    title: card.title ?? "",
                    description: card.description ?? "",
                })),
                lastCards: result.lastCards.map((card) => ({
                    icon: card.icon ?? "",
                    title: card.title ?? "",
                    highlightsList: (card.highlights ?? []).join("\n"),
                })),
                joinerFloor: {
                    description: result.joinerFloor.description?.length === 2
                        ? result.joinerFloor.description
                        : ["", ""],
                    files: result.joinerFloor.files.map((file) => ({
                        tag: file.tag ?? "",
                        fileFile: undefined,
                        existing: file,
                    })),
                },
                geniusFloor: {
                    description: result.geniusFloor.description?.length === 2
                        ? result.geniusFloor.description
                        : ["", ""],
                    files: result.geniusFloor.files.map((file) => ({
                        tag: file.tag ?? "",
                        fileFile: undefined,
                        existing: file,
                    })),
                },
            });
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, form]);

    const onSubmit = async (values: LandWalkinFormValues) => {
        await update({
            firstCards: values.firstCards,
            lastCards: values.lastCards.map((card) => ({
                icon: card.icon,
                title: card.title,
                highlights: toList(card.highlightsList),
            })),
            joinerFloor: {
                description: values.joinerFloor.description,
                files: values.joinerFloor.files.map((file) => ({
                    tag: file.tag,
                    fileFile: file.fileFile as File | undefined,
                    existing: file.existing ? { ...file.existing, tag: file.tag } : undefined,
                })),
            },
            geniusFloor: {
                description: values.geniusFloor.description,
                files: values.geniusFloor.files.map((file) => ({
                    tag: file.tag,
                    fileFile: file.fileFile as File | undefined,
                    existing: file.existing ? { ...file.existing, tag: file.tag } : undefined,
                })),
            },
        });
    };

    return (
        <FormProvider {...form}>
            {getLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <div className="space-y-1 text-white">
                        <h1 className="text-2xl font-semibold text-white">Walkin</h1>
                        <p className="text-sm text-white/70">Add walkin service details</p>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-white">First Cards</h2>
                        {firstCards.fields.map((field, index) => (
                            <div key={field.id} className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                                <FieldGroup className="grid gap-4 md:grid-cols-2">
                                    <Field>
                                        <FieldLabel htmlFor={`walkin-first-icon-${index}`} className="text-white/80">
                                            Icon <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`walkin-first-icon-${index}`}
                                                placeholder="Icon"
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...form.register(`firstCards.${index}.icon`)}
                                            />
                                            <FieldError errors={[form.formState.errors.firstCards?.[index]?.icon]} />
                                        </FieldContent>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor={`walkin-first-title-${index}`} className="text-white/80">
                                            Title <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`walkin-first-title-${index}`}
                                                placeholder="Title"
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...form.register(`firstCards.${index}.title`)}
                                            />
                                            <FieldError errors={[form.formState.errors.firstCards?.[index]?.title]} />
                                        </FieldContent>
                                    </Field>
                                    <Field className="md:col-span-2">
                                        <FieldLabel htmlFor={`walkin-first-description-${index}`} className="text-white/80">
                                            Description <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <BasicRichEditor
                                                name={`firstCards.${index}.description`}
                                                value={firstCardsValue?.[index]?.description ?? ""}
                                            />
                                            <FieldError errors={[form.formState.errors.firstCards?.[index]?.description]} />
                                        </FieldContent>
                                    </Field>
                                </FieldGroup>
                                <Button
                                    type="button"
                                    className="bg-white/10 text-white hover:bg-white/20"
                                    disabled={firstCards.fields.length <= 1}
                                    onClick={() => firstCards.remove(index)}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            className="bg-white/10 text-white hover:bg-white/20"
                            onClick={() => firstCards.append({ ...defaultFirstCard })}
                        >
                            Add first card
                        </Button>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-white">Last Cards</h2>
                        {lastCards.fields.map((field, index) => (
                            <div key={field.id} className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                                <FieldGroup className="grid gap-4 md:grid-cols-2">
                                    <Field>
                                        <FieldLabel htmlFor={`walkin-last-icon-${index}`} className="text-white/80">
                                            Icon <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`walkin-last-icon-${index}`}
                                                placeholder="Icon"
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...form.register(`lastCards.${index}.icon`)}
                                            />
                                            <FieldError errors={[form.formState.errors.lastCards?.[index]?.icon]} />
                                        </FieldContent>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor={`walkin-last-title-${index}`} className="text-white/80">
                                            Title <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`walkin-last-title-${index}`}
                                                placeholder="Title"
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...form.register(`lastCards.${index}.title`)}
                                            />
                                            <FieldError errors={[form.formState.errors.lastCards?.[index]?.title]} />
                                        </FieldContent>
                                    </Field>
                                    <Field className="md:col-span-2">
                                        <FieldLabel htmlFor={`walkin-last-highlights-${index}`} className="text-white/80">
                                            Highlights list <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Textarea
                                                id={`walkin-last-highlights-${index}`}
                                                placeholder="One item per line"
                                                className="min-h-24 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...form.register(`lastCards.${index}.highlightsList`)}
                                            />
                                            <FieldError errors={[form.formState.errors.lastCards?.[index]?.highlightsList]} />
                                        </FieldContent>
                                    </Field>
                                </FieldGroup>
                                <Button
                                    type="button"
                                    className="bg-white/10 text-white hover:bg-white/20"
                                    disabled={lastCards.fields.length <= 1}
                                    onClick={() => lastCards.remove(index)}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            className="bg-white/10 text-white hover:bg-white/20"
                            onClick={() => lastCards.append({ ...defaultLastCard })}
                        >
                            Add last card
                        </Button>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                        <h2 className="text-lg font-semibold text-white">Joiner Floor</h2>
                        <FieldGroup className="grid gap-4 md:grid-cols-2">
                            {Array.from({ length: 2 }).map((_, index) => (
                                <Field key={`joiner-description-${index}`}>
                                    <FieldLabel htmlFor={`joiner-description-${index}`} className="text-white/80">
                                        Description {index + 1} <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <BasicRichEditor
                                            name={`joinerFloor.description.${index}`}
                                            value={joinerDescriptions?.[index] ?? ""}
                                        />
                                        <FieldError errors={[form.formState.errors.joinerFloor?.description?.[index]]} />
                                    </FieldContent>
                                </Field>
                            ))}
                        </FieldGroup>
                        <div className="space-y-4">
                            {joinerFiles.fields.map((field, index) => (
                                <div key={field.id} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                                    <FieldGroup>
                                        <Field>
                                            <FieldLabel htmlFor={`joiner-file-${index}`} className="text-white/80">
                                                File
                                            </FieldLabel>
                                            <FieldContent>
                                                <JoinerFileUploader
                                                    control={form.control}
                                                    name={`joinerFloor.files.${index}.fileFile`}
                                                    inputId={`joiner-file-${index}`}
                                                    existingUrl={currentData?.joinerFloor.files?.[index]?.url}
                                                />
                                                <FieldError errors={[form.formState.errors.joinerFloor?.files?.[index]?.fileFile]} />
                                            </FieldContent>
                                        </Field>
                                        <Field>
                                            <FieldLabel htmlFor={`joiner-tag-${index}`} className="text-white/80">
                                                Tag <span className="text-white">*</span>
                                            </FieldLabel>
                                            <FieldContent>
                                                <Input
                                                    id={`joiner-tag-${index}`}
                                                    placeholder="Tag"
                                                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                    {...form.register(`joinerFloor.files.${index}.tag`)}
                                                />
                                                <FieldError errors={[form.formState.errors.joinerFloor?.files?.[index]?.tag]} />
                                            </FieldContent>
                                        </Field>
                                    </FieldGroup>
                                    <Button
                                        type="button"
                                        className="bg-white/10 text-white hover:bg-white/20"
                                        disabled={joinerFiles.fields.length <= 1}
                                        onClick={() => joinerFiles.remove(index)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                className="bg-white/10 text-white hover:bg-white/20"
                                onClick={() => joinerFiles.append({ ...defaultJoinerFile })}
                            >
                                Add file
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                        <h2 className="text-lg font-semibold text-white">Genius Floor</h2>
                        <FieldGroup className="grid gap-4 md:grid-cols-2">
                            {Array.from({ length: 2 }).map((_, index) => (
                                <Field key={`genius-description-${index}`}>
                                    <FieldLabel htmlFor={`genius-description-${index}`} className="text-white/80">
                                        Description {index + 1} <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <BasicRichEditor
                                            name={`geniusFloor.description.${index}`}
                                            value={geniusDescriptions?.[index] ?? ""}
                                        />
                                        <FieldError errors={[form.formState.errors.geniusFloor?.description?.[index]]} />
                                    </FieldContent>
                                </Field>
                            ))}
                        </FieldGroup>
                        <div className="space-y-4">
                            {geniusFiles.fields.map((field, index) => (
                                <div key={field.id} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                                    <FieldGroup >
                                        <Field>
                                            <FieldLabel htmlFor={`genius-file-${index}`} className="text-white/80">
                                                File
                                            </FieldLabel>
                                            <FieldContent>
                                                <JoinerFileUploader
                                                    control={form.control}
                                                    name={`geniusFloor.files.${index}.fileFile`}
                                                    inputId={`genius-file-${index}`}
                                                    existingUrl={currentData?.geniusFloor.files?.[index]?.url}
                                                />
                                                <FieldError errors={[form.formState.errors.geniusFloor?.files?.[index]?.fileFile]} />
                                            </FieldContent>
                                        </Field>
                                        <Field>
                                            <FieldLabel htmlFor={`genius-tag-${index}`} className="text-white/80">
                                                Tag <span className="text-white">*</span>
                                            </FieldLabel>
                                            <FieldContent>
                                                <Input
                                                    id={`genius-tag-${index}`}
                                                    placeholder="Tag"
                                                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                    {...form.register(`geniusFloor.files.${index}.tag`)}
                                                />
                                                <FieldError errors={[form.formState.errors.geniusFloor?.files?.[index]?.tag]} />
                                            </FieldContent>
                                        </Field>
                                    </FieldGroup>
                                    <Button
                                        type="button"
                                        className="bg-white/10 text-white hover:bg-white/20"
                                        disabled={geniusFiles.fields.length <= 1}
                                        onClick={() => geniusFiles.remove(index)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                className="bg-white/10 text-white hover:bg-white/20"
                                onClick={() => geniusFiles.append({ ...defaultJoinerFile })}
                            >
                                Add file
                            </Button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-white/90 text-black hover:bg-white"
                        disabled={getLoading || updateLoading || !form.formState.isValid}
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

export default LandWalkinService;

