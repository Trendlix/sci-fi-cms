import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
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
import { useAboutStore } from "@/shared/hooks/store/about/useAboutStore";
import { Upload } from "lucide-react";
import type { AboutPayload } from "@/shared/hooks/store/about/about.types";

const fileSchema = z.any().refine((file) => !file || file instanceof File, {
    message: "Icon must be a file",
});

const aboutCardSchema = z.object({
    iconFile: fileSchema.optional(),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
});

export const AboutSectionZodSchema = z.object({
    description: z.string().min(10, "Description is required"),
    cards: z.array(aboutCardSchema).min(1).max(2),
});

type AboutSectionFormValues = z.infer<typeof AboutSectionZodSchema>;

const defaultCard: AboutSectionFormValues["cards"][number] = {
    iconFile: undefined,
    title: "",
    description: "",
};

type IconUploaderProps = {
    control: ReturnType<typeof useForm<AboutSectionFormValues>>["control"];
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

const AboutAbout = () => {
    const { get, update, getLoading, updateLoading } = useAboutStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const [currentSection, setCurrentSection] = useState<AboutPayload["about"] | null>(null);
    const aboutForm = useForm<AboutSectionFormValues>({
        defaultValues: {
            description: "",
            cards: [defaultCard],
        },
        resolver: zodResolver(AboutSectionZodSchema),
        mode: "onChange",
    });
    const descriptionValue = useWatch({ control: aboutForm.control, name: "description" });
    const cardsValue = useWatch({ control: aboutForm.control, name: "cards" });

    const cardFields = useFieldArray({
        control: aboutForm.control,
        name: "cards",
    });

    useEffect(() => {
        let isActive = true;
        aboutForm.reset({ description: "", cards: [defaultCard] });
        aboutForm.clearErrors();

        const load = async () => {
            const result = await get("about") as AboutPayload["about"] | null;
            if (!isActive) return;
            setCurrentSection(result ?? null);
            if (!result) {
                aboutForm.reset({ description: "", cards: [defaultCard] });
                return;
            }
            aboutForm.reset({
                description: result.description ?? "",
                cards: result.cards?.length
                    ? result.cards.map((card) => ({
                        iconFile: undefined,
                        title: card.title ?? "",
                        description: card.description ?? "",
                    }))
                    : [defaultCard],
            });
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, aboutForm]);

    const onSubmit = async (formData: AboutSectionFormValues) => {
        await update("about", formData);
    };

    return (
        <FormProvider {...aboutForm}>
            {getLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={aboutForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <div className="space-y-1 text-white">
                        <h1 className="text-2xl font-semibold text-white">About Section</h1>
                        <p className="text-sm text-white/70">Add the description and cards</p>
                    </div>
                    <Field>
                        <FieldLabel htmlFor="about-description" className="text-white/80">
                            Description <span className="text-white">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <BasicRichEditor name="description" value={descriptionValue ?? ""} />
                            <FieldError errors={[aboutForm.formState.errors.description]} />
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
                                        disabled={cardFields.fields.length <= 1}
                                        onClick={() => cardFields.remove(index)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor={`about-icon-${index}`} className="text-white/80">
                                            Icon
                                        </FieldLabel>
                                        <FieldContent>
                                            <IconUploader
                                                control={aboutForm.control}
                                                name={`cards.${index}.iconFile`}
                                                inputId={`about-icon-${index}`}
                                                existingUrl={currentSection?.cards?.[index]?.icon?.url}
                                            />
                                            <FieldError errors={[aboutForm.formState.errors.cards?.[index]?.iconFile]} />
                                        </FieldContent>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor={`about-title-${index}`} className="text-white/80">
                                            Title <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`about-title-${index}`}
                                                placeholder="Card title"
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...aboutForm.register(`cards.${index}.title`)}
                                            />
                                            <FieldError errors={[aboutForm.formState.errors.cards?.[index]?.title]} />
                                        </FieldContent>
                                    </Field>
                                    <Field className="md:col-span-2">
                                        <FieldLabel htmlFor={`about-description-${index}`} className="text-white/80">
                                            Description <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <BasicRichEditor
                                                name={`cards.${index}.description`}
                                                value={cardsValue?.[index]?.description ?? ""}
                                            />
                                            <FieldError errors={[aboutForm.formState.errors.cards?.[index]?.description]} />
                                        </FieldContent>
                                    </Field>
                                </FieldGroup>
                            </div>
                        ))}
                    </div>
                    <Button
                        type="button"
                        className="bg-white/10 text-white hover:bg-white/20"
                        disabled={cardFields.fields.length >= 2}
                        onClick={() => cardFields.append(defaultCard)}
                    >
                        Add card
                    </Button>
                    <Button
                        type="submit"
                        className="w-full bg-white/90 text-black hover:bg-white"
                        disabled={getLoading || updateLoading || !aboutForm.formState.isValid}
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

export default AboutAbout;