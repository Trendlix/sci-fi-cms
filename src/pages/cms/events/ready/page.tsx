import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import BasicRichEditor from "@/components/tiptap/BasicRichEditor";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
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
    const { get, update, getLoading, updateLoading } = useEventReadyStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const readyForm = useForm<EventReadyFormValues>({
        defaultValues,
        resolver: zodResolver(EventReadyZodSchema),
        mode: "onChange",
    });

    const cardsValue = useWatch({ control: readyForm.control, name: "cards" });
    const descriptionValue = useWatch({ control: readyForm.control, name: "description" });

    useEffect(() => {
        let isActive = true;
        readyForm.reset(defaultValues);
        readyForm.clearErrors();

        const load = async () => {
            const result = await get().catch(() => null);
            if (!isActive) return;
            if (!result) {
                readyForm.reset(defaultValues);
                return;
            }
            const cards = result.cards?.length === 3
                ? result.cards.map((card) => ({
                    icon: card.icon ?? "",
                    no: card.no ?? 0,
                    title: card.title ?? "",
                }))
                : [defaultCard, defaultCard, defaultCard];
            readyForm.reset({
                description: result.description ?? "",
                cards,
            });
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, readyForm]);

    const onSubmit = async (formData: EventReadyFormValues) => {
        await update(formData);
    };

    return (
        <FormProvider {...readyForm}>
            {getLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
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
                        <BasicRichEditor
                            name="description"
                            value={descriptionValue ?? ""}
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
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
        </div>
    );
};

export default EventsReady;

