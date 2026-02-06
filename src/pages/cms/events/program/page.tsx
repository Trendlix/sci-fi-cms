import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import BasicRichEditor from "@/components/tiptap/BasicRichEditor";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useFieldArray, useForm, useFormContext, useWatch } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventProgramStore } from "@/shared/hooks/store/events/useEventProgramStore";
import type { EventProgramPayload } from "@/shared/hooks/store/events/events.types";
import { X } from "lucide-react";

const featureItemSchema = z.object({
    value: z.string().min(1, "Feature is required"),
});

const programCardSchema = z.object({
    icon: z.string().min(1, "Icon is required"),
    description: z.string().min(10, "Description is required"),
    features: z.array(featureItemSchema).min(1).max(5),
});

export const EventProgramZodSchema = z.object({
    vr_arena: programCardSchema,
    printing_lab_3d: programCardSchema,
    innovation_lab: programCardSchema,
    tech_museum: programCardSchema,
    digital_art_studio: programCardSchema,
});

type EventProgramFormValues = z.infer<typeof EventProgramZodSchema>;

const defaultFeatures = () => [{ value: "" }];

const defaultCard = () => ({
    icon: "",
    description: "",
    features: defaultFeatures(),
});

const programCards = [
    { key: "vr_arena", label: "VR Arena" },
    { key: "printing_lab_3d", label: "3D Printing Lab" },
    { key: "innovation_lab", label: "Innovation Lab" },
    { key: "tech_museum", label: "Tech Museum" },
    { key: "digital_art_studio", label: "Digital Art Studio" },
] as const;

type ProgramKey = typeof programCards[number]["key"];

type FeaturesListProps = {
    cardKey: ProgramKey;
};

const FeaturesList = ({ cardKey }: FeaturesListProps) => {
    const { control, register } = useFormContext<EventProgramFormValues>();
    const featuresFieldArray = useFieldArray({
        control,
        name: `${cardKey}.features`,
    });

    return (
        <div className="space-y-3">
            {featuresFieldArray.fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-3">
                    <div className="flex-1">
                        <Input
                            placeholder={`Feature ${index + 1}`}
                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                            {...register(`${cardKey}.features.${index}.value`)}
                        />
                    </div>
                    <Button
                        type="button"
                        className="bg-white/10 text-white hover:bg-white/20"
                        disabled={featuresFieldArray.fields.length <= 1}
                        onClick={() => featuresFieldArray.remove(index)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                className="bg-white/10 text-white hover:bg-white/20"
                disabled={featuresFieldArray.fields.length >= 5}
                onClick={() => featuresFieldArray.append({ value: "" })}
            >
                Add feature
            </Button>
        </div>
    );
};

const EventsProgram = () => {
    const { get, update, getLoading, updateLoading } = useEventProgramStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const programForm = useForm<EventProgramFormValues>({
        defaultValues: {
            vr_arena: defaultCard(),
            printing_lab_3d: defaultCard(),
            innovation_lab: defaultCard(),
            tech_museum: defaultCard(),
            digital_art_studio: defaultCard(),
        },
        resolver: zodResolver(EventProgramZodSchema),
        mode: "onChange",
    });

    const cardValues = useWatch({ control: programForm.control });
    const { errors, isSubmitted } = programForm.formState;
    const hasSubmitErrors = programCards.some((card) => {
        const cardErrors = errors?.[card.key];
        if (!cardErrors) {
            return false;
        }
        return !!cardErrors.icon || !!cardErrors.description || (Array.isArray(cardErrors.features) && cardErrors.features.some(Boolean));
    });

    useEffect(() => {
        let isActive = true;
        programForm.reset({
            vr_arena: defaultCard(),
            printing_lab_3d: defaultCard(),
            innovation_lab: defaultCard(),
            tech_museum: defaultCard(),
            digital_art_studio: defaultCard(),
        });
        programForm.clearErrors();

        const load = async () => {
            const result = await get().catch(() => null);
            if (!isActive) return;
            if (!result) {
                programForm.reset({
                    vr_arena: defaultCard(),
                    printing_lab_3d: defaultCard(),
                    innovation_lab: defaultCard(),
                    tech_museum: defaultCard(),
                    digital_art_studio: defaultCard(),
                });
                return;
            }
            const toCard = (card?: EventProgramPayload[ProgramKey]) => ({
                icon: card?.icon ?? "",
                description: card?.description ?? "",
                features: card?.features?.length
                    ? card.features.map((value) => ({ value }))
                    : defaultFeatures(),
            });
            programForm.reset({
                vr_arena: toCard(result.vr_arena),
                printing_lab_3d: toCard(result.printing_lab_3d),
                innovation_lab: toCard(result.innovation_lab),
                tech_museum: toCard(result.tech_museum),
                digital_art_studio: toCard(result.digital_art_studio),
            });
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, programForm]);

    const toList = (items: { value: string }[]) => items.map((item) => item.value.trim()).filter(Boolean);

    const onSubmit = async (formData: EventProgramFormValues) => {
        await update({
            vr_arena: {
                icon: formData.vr_arena.icon,
                description: formData.vr_arena.description,
                features: toList(formData.vr_arena.features),
            },
            printing_lab_3d: {
                icon: formData.printing_lab_3d.icon,
                description: formData.printing_lab_3d.description,
                features: toList(formData.printing_lab_3d.features),
            },
            innovation_lab: {
                icon: formData.innovation_lab.icon,
                description: formData.innovation_lab.description,
                features: toList(formData.innovation_lab.features),
            },
            tech_museum: {
                icon: formData.tech_museum.icon,
                description: formData.tech_museum.description,
                features: toList(formData.tech_museum.features),
            },
            digital_art_studio: {
                icon: formData.digital_art_studio.icon,
                description: formData.digital_art_studio.description,
                features: toList(formData.digital_art_studio.features),
            },
        });
    };

    return (
        <FormProvider {...programForm}>
            {getLoading ? (
                <LoadingSkeleton isRtl={isRtl} programCards={programCards} />
            ) : (
                <form onSubmit={programForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                <CommonLanguageSwitcherCheckbox />
                <div className="space-y-1 text-white">
                    <h1 className="text-2xl font-semibold text-white">Events Program</h1>
                    <p className="text-sm text-white/70">Update program cards</p>
                </div>
                <div className="space-y-6">
                    {programCards.map((card) => {
                        const descriptionValue =
                            cardValues?.[card.key]?.description ??
                            programForm.getValues(`${card.key}.description`);

                        return (
                            <div key={card.key} className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                                <h2 className="text-lg font-semibold text-white">{card.label}</h2>
                                <FieldGroup className="grid gap-4 md:grid-cols-2">
                                    <Field>
                                        <FieldLabel htmlFor={`events-program-icon-${card.key}`} className="text-white/80">
                                        Icon <span className="text-white">*</span> (required)
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`events-program-icon-${card.key}`}
                                                placeholder="Enter icon"
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...programForm.register(`${card.key}.icon`)}
                                            />
                                        </FieldContent>
                                    </Field>
                                </FieldGroup>
                                <Field>
                                <FieldLabel className="text-white/80">Features <span className="text-white">*</span> (at least 1)</FieldLabel>
                                    <FieldContent>
                                        <FeaturesList cardKey={card.key} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel className="text-white/80">
                                    Description <span className="text-white">*</span> (at least 10 characters)
                                    </FieldLabel>
                                    <FieldContent>
                                        <BasicRichEditor
                                            name={`${card.key}.description`}
                                            value={descriptionValue ?? ""}
                                        />
                                    </FieldContent>
                                </Field>
                            </div>
                        );
                    })}
                </div>
                {isSubmitted && hasSubmitErrors ? (
                    <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                        <p className="font-medium">Please fix the following fields:</p>
                        <ul className="mt-2 list-disc pl-5">
                            {programCards.map((card) => {
                                const cardErrors = errors?.[card.key];
                                if (!cardErrors) {
                                    return null;
                                }
                                const items = [];
                                if (cardErrors.icon) {
                                    items.push(<li key={`events-program-icon-${card.key}`}>{card.label} icon</li>);
                                }
                                if (cardErrors.description) {
                                    items.push(<li key={`events-program-description-${card.key}`}>{card.label} description</li>);
                                }
                                if (Array.isArray(cardErrors.features)) {
                                    cardErrors.features.forEach((featureError, featureIndex) => {
                                        if (featureError?.value) {
                                            items.push(
                                                <li key={`events-program-feature-${card.key}-${featureIndex}`}>
                                                    {card.label} feature {featureIndex + 1}
                                                </li>
                                            );
                                        }
                                    });
                                }
                                return items;
                            })}
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

const LoadingSkeleton = ({ isRtl, programCards }: { isRtl: boolean; programCards: ReadonlyArray<{ key: string }> }) => {
    return (
        <div className={cn("space-y-4", isRtl && "home-rtl")}>
            <CommonLanguageSwitcherCheckbox />
            <div className="space-y-2">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-64" />
            </div>
            {programCards.map((card) => (
                <div key={card.key} className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
            <Skeleton className="h-10 w-full" />
        </div>
    );
};

export default EventsProgram;

