import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect, useMemo } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useLandDiscoverFloorsStore } from "@/shared/hooks/store/land/useLandDiscoverFloorsStore";
import { Upload } from "lucide-react";

const fileSchema = z.any().refine((file) => !file || file instanceof File, {
    message: "Icon must be a file",
});

const discoverCardSchema = z.object({
    title: z.string().min(3, "Title is required").max(20),
    description: z.string().min(10, "Description is required"),
    link: z.string().min(1, "Link is required"),
    iconFile: fileSchema.optional(),
});

export const DiscoverFloorsZodSchema = z.object({
    description: z.string().min(10, "Description is required"),
    cards: z.array(discoverCardSchema).min(6),
});

type DiscoverFloorsFormValues = z.infer<typeof DiscoverFloorsZodSchema>;

const defaultCard: DiscoverFloorsFormValues["cards"][number] = {
    title: "",
    description: "",
    link: "",
    iconFile: undefined,
};

type IconUploaderProps = {
    control: ReturnType<typeof useForm<DiscoverFloorsFormValues>>["control"];
    name: `cards.${number}.iconFile`;
    inputId: string;
    existingUrl?: string;
};

const IconUploader = ({ control, name, inputId, existingUrl }: IconUploaderProps) => {
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
                        className="relative flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-white/30 bg-white/5 text-xs text-white/70 transition hover:bg-white/10"
                    >
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Icon preview"
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        ) : (
                            <>
                                <Upload size={18} className="text-white/70" />
                                <span className="text-center">Upload icon</span>
                            </>
                        )}
                    </label>
                    <span className="text-xs text-white/60">
                        {controllerField.value instanceof File
                            ? controllerField.value.name
                            : existingUrl
                                ? "Current icon"
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

const DiscoverFloors = () => {
    const { data, get, update, getLoading, updateLoading } = useLandDiscoverFloorsStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const currentData = data?.[language] ?? null;
    const discoverForm = useForm<DiscoverFloorsFormValues>({
        defaultValues: {
            description: "",
            cards: Array.from({ length: 6 }).map(() => ({ ...defaultCard })),
        },
        resolver: zodResolver(DiscoverFloorsZodSchema),
        mode: "onChange",
    });

    const cardFields = useFieldArray({
        control: discoverForm.control,
        name: "cards",
    });

    useEffect(() => {
        void get();
    }, [get, language, discoverForm]);

    useEffect(() => {
        if (currentData === null) {
            return;
        }
        discoverForm.reset({
            description: currentData.description ?? "",
            cards: currentData.cards?.length
                ? currentData.cards.map((card) => ({
                    title: card.title ?? "",
                    description: card.description ?? "",
                    link: card.link ?? "",
                    iconFile: undefined,
                }))
                : Array.from({ length: 6 }).map(() => ({ ...defaultCard })),
        });
    }, [currentData, discoverForm]);

    const onSubmit = async (formData: DiscoverFloorsFormValues) => {
        await update(formData);
    };

    return (
        <FormProvider {...discoverForm}>
            {getLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={discoverForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <div className="space-y-1 text-white">
                        <h1 className="text-2xl font-semibold text-white">Discover Floors</h1>
                        <p className="text-sm text-white/70">Add the description and cards (min 6)</p>
                    </div>
                    <Field>
                        <FieldLabel htmlFor="discover-floors-description" className="text-white/80">
                            Description <span className="text-white">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <Textarea
                                id="discover-floors-description"
                                placeholder="Enter description"
                                className="min-h-28 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                {...discoverForm.register("description")}
                            />
                            <FieldError errors={[discoverForm.formState.errors.description]} />
                        </FieldContent>
                    </Field>
                    <div className="space-y-6">
                        {cardFields.fields.map((field, index) => (
                            <div key={field.id} className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-white">Card {index + 1}</h2>
                                    <Button
                                        type="button"
                                        className="bg-white/10 text-white hover:bg-white/20"
                                        disabled={cardFields.fields.length <= 6}
                                        onClick={() => cardFields.remove(index)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor={`discover-icon-${index}`} className="text-white/80">
                                            Icon
                                        </FieldLabel>
                                        <FieldContent>
                                            <IconUploader
                                                control={discoverForm.control}
                                                name={`cards.${index}.iconFile`}
                                                inputId={`discover-icon-${index}`}
                                                existingUrl={currentData?.cards?.[index]?.icon?.url}
                                            />
                                            <FieldError errors={[discoverForm.formState.errors.cards?.[index]?.iconFile]} />
                                        </FieldContent>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor={`discover-title-${index}`} className="text-white/80">
                                            Title <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`discover-title-${index}`}
                                                placeholder="Title"
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...discoverForm.register(`cards.${index}.title`)}
                                            />
                                            <FieldError errors={[discoverForm.formState.errors.cards?.[index]?.title]} />
                                        </FieldContent>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor={`discover-link-${index}`} className="text-white/80">
                                            Link <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`discover-link-${index}`}
                                                placeholder="https://..."
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...discoverForm.register(`cards.${index}.link`)}
                                            />
                                            <FieldError errors={[discoverForm.formState.errors.cards?.[index]?.link]} />
                                        </FieldContent>
                                    </Field>
                                    <Field className="md:col-span-2">
                                        <FieldLabel htmlFor={`discover-description-${index}`} className="text-white/80">
                                            Description <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Textarea
                                                id={`discover-description-${index}`}
                                                placeholder="Card description"
                                                className="min-h-24 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...discoverForm.register(`cards.${index}.description`)}
                                            />
                                            <FieldError errors={[discoverForm.formState.errors.cards?.[index]?.description]} />
                                        </FieldContent>
                                    </Field>
                                </FieldGroup>
                            </div>
                        ))}
                    </div>
                    <Button
                        type="button"
                        className="bg-white/10 text-white hover:bg-white/20"
                        onClick={() => cardFields.append({ ...defaultCard })}
                    >
                        Add card
                    </Button>
                    <Button
                        type="submit"
                        className="w-full bg-white/90 text-black hover:bg-white"
                        disabled={getLoading || updateLoading || !discoverForm.formState.isValid}
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
                <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
        </div>
    );
};

export default DiscoverFloors;

