import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventReadyStore } from "@/shared/hooks/store/events/useEventReadyStore";

const readyCardSchema = z.object({
    icon: z.string().min(1, "Icon is required"),
    no: z.number().min(1, "Number is required"),
    title: z.string().min(1, "Title is required"),
});

export const EventReadyZodSchema = z.object({
    description: z.string().min(1, "Description is required"),
    cards: z.array(readyCardSchema).length(3),
});

type EventReadyFormValues = z.infer<typeof EventReadyZodSchema>;

const defaultCard = {
    icon: "",
    no: 0,
    title: "",
};

const defaultValues: EventReadyFormValues = {
    description: "",
    cards: [defaultCard, defaultCard, defaultCard],
};

const EventsReady = () => {
    const { data, get, update, getLoading, updateLoading } = useEventReadyStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const currentData = data?.[language] ?? null;
    const hasInitialized = useRef(false);
    const readyForm = useForm<EventReadyFormValues>({
        defaultValues,
        resolver: zodResolver(EventReadyZodSchema),
        mode: "onChange",
    });

    const cardsValue = useWatch({ control: readyForm.control, name: "cards" });

    useEffect(() => {
        hasInitialized.current = false;
        void get();
    }, [get, language]);

    useEffect(() => {
        if (currentData === null || hasInitialized.current) {
            return;
        }
        const cards = currentData.cards?.length === 3
            ? currentData.cards.map((card) => ({
                icon: card.icon ?? "",
                no: card.no ?? 0,
                title: card.title ?? "",
            }))
            : [defaultCard, defaultCard, defaultCard];
        readyForm.reset({
            description: currentData.description ?? "",
            cards,
        });
        hasInitialized.current = true;
    }, [currentData, readyForm]);

    const onSubmit = async (formData: EventReadyFormValues) => {
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
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <FormProvider {...readyForm}>
            <form onSubmit={readyForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                <CommonLanguageSwitcherCheckbox />
                <div className="space-y-1 text-white">
                    <h1 className="text-2xl font-semibold text-white">Events Ready</h1>
                    <p className="text-sm text-white/70">Add description and cards</p>
                </div>
                <Field>
                    <FieldLabel htmlFor="events-ready-description" className="text-white/80">
                        Description <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <Textarea
                            id="events-ready-description"
                            placeholder="Enter description"
                            className="min-h-28 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                            {...readyForm.register("description")}
                        />
                        <FieldError errors={[readyForm.formState.errors.description]} />
                    </FieldContent>
                </Field>
                <div className="space-y-6">
                    {cardsValue?.map((_, index) => (
                        <div key={`ready-card-${index}`} className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                            <h2 className="text-lg font-semibold text-white">Card {index + 1}</h2>
                            <FieldGroup className="grid gap-4 md:grid-cols-3">
                                <Field>
                                    <FieldLabel htmlFor={`events-ready-icon-${index}`} className="text-white/80">
                                        Icon <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`events-ready-icon-${index}`}
                                            placeholder="Enter icon"
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...readyForm.register(`cards.${index}.icon`)}
                                        />
                                        <FieldError errors={[readyForm.formState.errors.cards?.[index]?.icon]} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor={`events-ready-no-${index}`} className="text-white/80">
                                        No <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`events-ready-no-${index}`}
                                            type="number"
                                            min={0}
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...readyForm.register(`cards.${index}.no`, { valueAsNumber: true })}
                                        />
                                        <FieldError errors={[readyForm.formState.errors.cards?.[index]?.no]} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor={`events-ready-title-${index}`} className="text-white/80">
                                        Title <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`events-ready-title-${index}`}
                                            placeholder="Enter title"
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...readyForm.register(`cards.${index}.title`)}
                                        />
                                        <FieldError errors={[readyForm.formState.errors.cards?.[index]?.title]} />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </div>
                    ))}
                </div>
                <Button
                    type="submit"
                    className="w-full bg-white/90 text-black hover:bg-white"
                    disabled={getLoading || updateLoading || !readyForm.formState.isValid}
                >
                    {updateLoading ? "Saving..." : "Save"}
                </Button>
            </form>
        </FormProvider>
    );
};

export default EventsReady;

