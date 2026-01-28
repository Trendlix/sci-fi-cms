import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import BasicRichEditor from "@/components/tiptap/BasicRichEditor";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useAboutStore } from "@/shared/hooks/store/about/useAboutStore";

const valueCardSchema = z.object({
    icon: z.string().min(1, "Icon is required"),
    title: z.string().min(3, "Title is required").max(20),
    description: z.string().min(10, "Description is required").max(100),
});

export const AboutValueZodSchema = z.object({
    description: z.string().min(10, "Description is required").max(100),
    cards: z.array(valueCardSchema).min(1),
});

type AboutValueFormValues = z.infer<typeof AboutValueZodSchema>;

const defaultCard: AboutValueFormValues["cards"][number] = {
    icon: "",
    title: "",
    description: "",
};

const AboutValue = () => {
    const { data, get, update, getLoading, updateLoading } = useAboutStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const valueForm = useForm<AboutValueFormValues>({
        defaultValues: {
            description: "",
            cards: [defaultCard],
        },
        resolver: zodResolver(AboutValueZodSchema),
        mode: "onChange",
    });

    const cardFields = useFieldArray({
        control: valueForm.control,
        name: "cards",
    });

    useEffect(() => {
        void get();
    }, [get, language]);

    useEffect(() => {
        if (!data?.value) {
            valueForm.reset({ description: "", cards: [defaultCard] });
            return;
        }
        valueForm.reset({
            description: data.value.description ?? "",
            cards: data.value.cards?.length
                ? data.value.cards.map((card) => ({
                    icon: card.icon ?? "",
                    title: card.title ?? "",
                    description: card.description ?? "",
                }))
                : [defaultCard],
        });
    }, [data, valueForm]);

    const onSubmit = async (formData: AboutValueFormValues) => {
        await update({ value: formData });
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
        <FormProvider {...valueForm}>
            <form onSubmit={valueForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                <CommonLanguageSwitcherCheckbox />
                <div className="space-y-1 text-white">
                    <h1 className="text-2xl font-semibold text-white">Value Section</h1>
                    <p className="text-sm text-white/70">Add value cards</p>
                </div>
                <Field>
                    <FieldLabel htmlFor="value-description" className="text-white/80">
                        Description <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <BasicRichEditor name="description" />
                        <FieldError errors={[valueForm.formState.errors.description]} />
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
                            <FieldGroup className="grid gap-4 md:grid-cols-2">
                                <Field>
                                    <FieldLabel htmlFor={`value-icon-${index}`} className="text-white/80">
                                        Icon <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`value-icon-${index}`}
                                            placeholder="Icon name"
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...valueForm.register(`cards.${index}.icon`)}
                                        />
                                        <FieldError errors={[valueForm.formState.errors.cards?.[index]?.icon]} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor={`value-title-${index}`} className="text-white/80">
                                        Title <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`value-title-${index}`}
                                            placeholder="Title"
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...valueForm.register(`cards.${index}.title`)}
                                        />
                                        <FieldError errors={[valueForm.formState.errors.cards?.[index]?.title]} />
                                    </FieldContent>
                                </Field>
                                <Field className="md:col-span-2">
                                    <FieldLabel htmlFor={`value-description-${index}`} className="text-white/80">
                                        Description <span className="text-white">*</span>
                                    </FieldLabel>
                                <FieldContent>
                                    <BasicRichEditor name={`cards.${index}.description`} />
                                    <FieldError errors={[valueForm.formState.errors.cards?.[index]?.description]} />
                                </FieldContent>
                                </Field>
                            </FieldGroup>
                        </div>
                    ))}
                </div>
                <Button
                    type="button"
                    className="bg-white/10 text-white hover:bg-white/20"
                    onClick={() => cardFields.append(defaultCard)}
                >
                    Add card
                </Button>
                <Button
                    type="submit"
                    className="w-full bg-white/90 text-black hover:bg-white"
                    disabled={getLoading || updateLoading || !valueForm.formState.isValid}
                >
                    {updateLoading ? "Saving..." : "Save"}
                </Button>
            </form>
        </FormProvider>
    );
};

export default AboutValue;