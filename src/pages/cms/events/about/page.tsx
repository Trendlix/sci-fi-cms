import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import BasicRichEditor from "@/components/tiptap/BasicRichEditor";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventAboutStore } from "@/shared/hooks/store/events/useEventAboutStore";

const eventAboutCardSchema = z.object({
    icon: z.string().min(1, "Icon is required"),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(10, "Description is required"),
});

export const EventAboutZodSchema = z.object({
    description: z.string().min(10, "Description is required"),
    cards: z.array(eventAboutCardSchema).min(1),
});

type EventAboutFormValues = z.infer<typeof EventAboutZodSchema>;

const defaultCard: EventAboutFormValues["cards"][number] = {
    icon: "",
    title: "",
    description: "",
};

const EventsAbout = () => {
    const { data, get, update, getLoading, updateLoading } = useEventAboutStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const currentData = data?.[language] ?? null;
    const hasInitialized = useRef(false);
    const aboutForm = useForm<EventAboutFormValues>({
        defaultValues: {
            description: "",
            cards: [defaultCard],
        },
        resolver: zodResolver(EventAboutZodSchema),
        mode: "onChange",
    });

    const cardsValue = useWatch({ control: aboutForm.control, name: "cards" });

    const cardFields = useFieldArray({
        control: aboutForm.control,
        name: "cards",
    });

    useEffect(() => {
        hasInitialized.current = false;
        void get();
    }, [get, language]);

    useEffect(() => {
        if (currentData === null || hasInitialized.current) {
            return;
        }
        aboutForm.reset({
            description: currentData.description ?? "",
            cards: currentData.cards?.length
                ? currentData.cards.map((card) => ({
                    icon: card.icon ?? "",
                    title: card.title ?? "",
                    description: card.description ?? "",
                }))
                : [defaultCard],
        });
        hasInitialized.current = true;
    }, [currentData, aboutForm]);

    const onSubmit = async (formData: EventAboutFormValues) => {
        await update(formData);
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
                <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <FormProvider {...aboutForm}>
            <form onSubmit={aboutForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                <CommonLanguageSwitcherCheckbox />
                <div className="space-y-1 text-white">
                    <h1 className="text-2xl font-semibold text-white">Events About</h1>
                    <p className="text-sm text-white/70">Add the description and cards</p>
                </div>
                <Field>
                    <FieldLabel htmlFor="events-about-description" className="text-white/80">
                        Description <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <Textarea
                            id="events-about-description"
                            placeholder="Enter description"
                            className="min-h-28 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                            {...aboutForm.register("description")}
                        />
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
                                    Remove card
                                </Button>
                            </div>
                            <FieldGroup className="grid gap-4 md:grid-cols-2">
                                <Field>
                                    <FieldLabel htmlFor={`events-about-icon-${index}`} className="text-white/80">
                                        Icon <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`events-about-icon-${index}`}
                                            placeholder="Enter icon"
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...aboutForm.register(`cards.${index}.icon`)}
                                        />
                                        <FieldError errors={[aboutForm.formState.errors.cards?.[index]?.icon]} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor={`events-about-title-${index}`} className="text-white/80">
                                        Title <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`events-about-title-${index}`}
                                            placeholder="Enter title"
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...aboutForm.register(`cards.${index}.title`)}
                                        />
                                        <FieldError errors={[aboutForm.formState.errors.cards?.[index]?.title]} />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                            <Field>
                                <FieldLabel htmlFor={`events-about-description-${index}`} className="text-white/80">
                                    Card Description <span className="text-white">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <BasicRichEditor
                                        name={`cards.${index}.description`}
                                        value={cardsValue?.[index]?.description ?? ""}
                                    />
                                    <FieldError errors={[aboutForm.formState.errors.cards?.[index]?.description]} />
                                </FieldContent>
                            </Field>
                        </div>
                    ))}
                    <Button
                        type="button"
                        className="bg-white/10 text-white hover:bg-white/20"
                        onClick={() => cardFields.append({ ...defaultCard })}
                    >
                        Add card
                    </Button>
                </div>
                <Button
                    type="submit"
                    className="w-full bg-white/90 text-black hover:bg-white"
                    disabled={getLoading || updateLoading || !aboutForm.formState.isValid}
                >
                    {updateLoading ? "Saving..." : "Save"}
                </Button>
            </form>
        </FormProvider>
    );
};

export default EventsAbout;

