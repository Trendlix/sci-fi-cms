import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useContactStore } from "@/shared/hooks/store/contact/useContactStore";
import type { ContactPayload } from "@/shared/hooks/store/contact/contact.types";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";

const typeOptions = ["phone", "email", "address", "hours"] as const;

const typeSchema = z
    .string()
    .min(1, "Type is required")
    .refine((value) => typeOptions.includes(value as (typeof typeOptions)[number]), {
        message: "Type must be valid",
    });

export const ContactZodValidationSchema = z.object({
    hero: z.object({
        description: z.string().min(10, "Description is required"),
    }),
    getInTouch: z.object({
        description: z.string().min(10, "Description is required"),
        cards: z
            .array(
                z.object({
                    type: typeSchema,
                    lines: z.array(z.string().min(1, "Line is required")).min(1).max(2),
                })
            )
            .min(1)
            .max(4),
    }),
});

type ContactFormValues = z.infer<typeof ContactZodValidationSchema>;

const defaultCard: ContactFormValues["getInTouch"]["cards"][number] = {
    type: "",
    lines: [""],
};

const DEFAULT_FORM_VALUES: ContactFormValues = {
    hero: {
        description: "",
    },
    getInTouch: {
        description: "",
        cards: [defaultCard],
    },
};

const buildNewCard = (
    cards: ContactFormValues["getInTouch"]["cards"] = []
): ContactFormValues["getInTouch"]["cards"][number] => {
    const usedTypes = new Set(cards.map((card) => card?.type).filter(Boolean));
    const preferredOrder = ["email", ...typeOptions.filter((type) => type !== "email")];
    const nextType = preferredOrder.find((type) => !usedTypes.has(type)) ?? "";
    return {
        ...defaultCard,
        type: nextType,
    };
};

type FormApi = ReturnType<typeof useForm<ContactFormValues>>;

type CardItem = ContactFormValues["getInTouch"]["cards"][number];

type CardFieldsProps = {
    index: number;
    form: FormApi;
    watchedCards: CardItem[] | undefined;
    isRemoveDisabled: boolean;
    onRemove: () => void;
};

const CardFields = ({ index, form, watchedCards, isRemoveDisabled, onRemove }: CardFieldsProps) => {
    const lines = useWatch({
        control: form.control,
        name: `getInTouch.cards.${index}.lines`,
    });
    const hasSecondLine = Array.isArray(lines) && lines.length > 1;

    return (
        <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white">Card {index + 1}</h3>
                <Button
                    type="button"
                    className="bg-white/10 text-white hover:bg-white/20"
                    disabled={isRemoveDisabled}
                    onClick={onRemove}
                >
                    Remove
                </Button>
            </div>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor={`card-type-${index}`} className="text-white/80">
                        Type <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <Controller
                            control={form.control}
                            name={`getInTouch.cards.${index}.type`}
                            render={({ field: controllerField }) => (
                                <Select
                                    value={controllerField.value || ""}
                                    onValueChange={controllerField.onChange}
                                >
                                    <SelectTrigger
                                        id={`card-type-${index}`}
                                        className="w-full border-white/20 bg-white/5 text-white focus-visible:border-white/40 rounded-xl!"
                                    >
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] rounded-xl! *:rounded-xl! text-white">
                                        {typeOptions.map((type) => {
                                            const isUsed = watchedCards?.some(
                                                (card, cardIndex) =>
                                                    cardIndex !== index && card?.type === type
                                            );
                                            return (
                                                <SelectItem key={type} value={type} disabled={isUsed}>
                                                    {type}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        <FieldError errors={[form.formState.errors.getInTouch?.cards?.[index]?.type]} />
                    </FieldContent>
                </Field>
                <Field>
                    <FieldLabel htmlFor={`card-line-1-${index}`} className="text-white/80">
                        Line 1 <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <Input
                            id={`card-line-1-${index}`}
                            placeholder="First line"
                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                            {...form.register(`getInTouch.cards.${index}.lines.0`)}
                        />
                        <FieldError errors={[form.formState.errors.getInTouch?.cards?.[index]?.lines?.[0]]} />
                    </FieldContent>
                </Field>
                {hasSecondLine ? (
                    <Field>
                        <FieldLabel htmlFor={`card-line-2-${index}`} className="text-white/80">
                            Line 2 <span className="text-white">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                id={`card-line-2-${index}`}
                                placeholder="Second line"
                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                {...form.register(`getInTouch.cards.${index}.lines.1`)}
                            />
                            <FieldError errors={[form.formState.errors.getInTouch?.cards?.[index]?.lines?.[1]]} />
                        </FieldContent>
                    </Field>
                ) : (
                    <div className="flex items-end">
                        <Button
                            type="button"
                            className="bg-white/10 text-white hover:bg-white/20"
                            onClick={() =>
                                form.setValue(`getInTouch.cards.${index}.lines.1`, "", {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                })
                            }
                        >
                            Add line
                        </Button>
                    </div>
                )}
            </FieldGroup>
        </div>
    );
};

type GetInTouchSectionProps = {
    form: FormApi;
    cardsFields: ReturnType<typeof useFieldArray<ContactFormValues, "getInTouch.cards">>;
    watchedCards: CardItem[] | undefined;
};

const GetInTouchSection = ({ form, cardsFields, watchedCards }: GetInTouchSectionProps) => {
    const descriptionValue = useWatch({
        control: form.control,
        name: "getInTouch.description",
    });

    return (
        <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
            <div className="space-y-1">
                <h2 className="text-lg font-semibold text-white">Get in Touch</h2>
                <p className="text-sm text-white/70">Add between 1 and 4 cards</p>
            </div>

            <Field>
                <FieldLabel htmlFor="get-in-touch-description" className="text-white/80">
                    Description <span className="text-white">*</span>
                </FieldLabel>
                <FieldContent>
                    <BasicRichEditor
                        name="getInTouch.description"
                        value={descriptionValue ?? ""}
                    />
                    <FieldError errors={[form.formState.errors.getInTouch?.description]} />
                </FieldContent>
            </Field>

            <div className="space-y-6">
                {cardsFields.fields.map((field, index) => (
                    <CardFields
                        key={field.id}
                        index={index}
                        form={form}
                        watchedCards={watchedCards}
                        isRemoveDisabled={cardsFields.fields.length <= 1}
                        onRemove={() => cardsFields.remove(index)}
                    />
                ))}
            </div>
            <Button
                type="button"
                className="bg-white/10 text-white hover:bg-white/20"
                disabled={cardsFields.fields.length >= 4}
                onClick={() => cardsFields.append(buildNewCard(watchedCards))}
            >
                Add card
            </Button>
        </div>
    );
};

type HeroSectionProps = {
    form: FormApi;
};

const HeroSection = ({ form }: HeroSectionProps) => {
    const descriptionValue = useWatch({
        control: form.control,
        name: "hero.description",
    });

    return (
        <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
            <h2 className="text-lg font-semibold text-white">Hero</h2>
            <Field>
                <FieldLabel htmlFor="hero-description" className="text-white/80">
                    Description <span className="text-white">*</span>
                </FieldLabel>
                <FieldContent>
                    <BasicRichEditor
                        name="hero.description"
                        value={descriptionValue ?? ""}
                    />
                    <FieldError errors={[form.formState.errors.hero?.description]} />
                </FieldContent>
            </Field>
        </div>
    );
};

const ContactPageHeader = () => (
    <div className="space-y-1 text-white">
        <h1 className="text-2xl font-semibold text-white">Contact</h1>
        <p className="text-sm text-white/70">Update the contact page content</p>
    </div>
);

type ContactSkeletonProps = {
    isRtl: boolean;
};

const ContactSkeleton = ({ isRtl }: ContactSkeletonProps) => (
    <div className={cn("space-y-4", isRtl && "home-rtl")}>
        <CommonLanguageSwitcherCheckbox />
        <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-28 w-full" />
        </div>
        <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
    </div>
);

type SaveButtonProps = {
    isDisabled: boolean;
    isLoading: boolean;
};

const SaveButton = ({ isDisabled, isLoading }: SaveButtonProps) => (
    <Button
        type="submit"
        className="bg-white/90 text-black hover:bg-white w-full"
        disabled={isDisabled}
    >
        {isLoading ? "Saving..." : "Save"}
    </Button>
);

const ContactPage = () => {
    const { get, update, getLoading, updateLoading } = useContactStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const contactForm = useForm<ContactFormValues>({
        defaultValues: DEFAULT_FORM_VALUES,
        resolver: zodResolver(ContactZodValidationSchema),
        mode: "onChange",
    });

    const cardsFields = useFieldArray({
        control: contactForm.control,
        name: "getInTouch.cards",
    });

    const watchedCards = useWatch({
        control: contactForm.control,
        name: "getInTouch.cards",
    });

    useEffect(() => {
        let isActive = true;
        contactForm.reset(DEFAULT_FORM_VALUES);
        contactForm.clearErrors();

        const load = async () => {
            const result = await get();
            if (!isActive) return;
            if (!result) {
                contactForm.reset(DEFAULT_FORM_VALUES);
                return;
            }
            contactForm.reset({
                hero: {
                    description: result.hero?.description ?? "",
                },
                getInTouch: {
                    description: result.getInTouch?.description ?? "",
                    cards: result.getInTouch?.cards?.length
                        ? result.getInTouch.cards.map((card) => ({
                            type: card.type ?? "",
                            lines: card.lines?.length ? card.lines : [""],
                        }))
                        : [defaultCard],
                },
            });
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, contactForm]);

    const onSubmit = async (formData: ContactFormValues) => {
        const payload: ContactPayload = {
            hero: {
                description: formData.hero.description,
            },
            getInTouch: {
                description: formData.getInTouch.description,
                cards: formData.getInTouch.cards.map((card) => ({
                    type: card.type as ContactPayload["getInTouch"]["cards"][number]["type"],
                    lines: card.lines,
                })),
            },
        };
        await update(payload);
    };

    return (
        <FormProvider {...contactForm}>
            {getLoading ? (
                <ContactSkeleton isRtl={isRtl} />
            ) : (
                <form
                    onSubmit={contactForm.handleSubmit(onSubmit)}
                    className={cn("space-y-6", isRtl && "home-rtl")}
                >
                    <CommonLanguageSwitcherCheckbox />
                    <ContactPageHeader />
                    <HeroSection form={contactForm} />
                    <GetInTouchSection
                        form={contactForm}
                        cardsFields={cardsFields}
                        watchedCards={watchedCards}
                    />
                    <SaveButton
                        isDisabled={getLoading || updateLoading || !contactForm.formState.isValid}
                        isLoading={updateLoading}
                    />
                </form>
            )}
        </FormProvider>
    );
};

export default ContactPage;