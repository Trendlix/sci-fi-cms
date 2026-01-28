import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudioWhyUsStore } from "@/shared/hooks/store/studio/useStudioWhyUsStore";

const lineSchema = z.object({
    icon: z.string().min(1, "Icon is required"),
    line: z.string().min(3, "Line is required").max(200),
});

export const StudioWhyUsZodSchema = z.object({
    description: z.string().min(10, "Description is required"),
    lines: z.array(lineSchema).min(1),
});

type StudioWhyUsFormValues = z.infer<typeof StudioWhyUsZodSchema>;

const defaultLine: StudioWhyUsFormValues["lines"][number] = {
    icon: "",
    line: "",
};

const StudioWhyUs = () => {
    const { data, get, update, getLoading, updateLoading } = useStudioWhyUsStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const currentData = data?.[language] ?? null;
    const whyUsForm = useForm<StudioWhyUsFormValues>({
        defaultValues: {
            description: "",
            lines: [defaultLine],
        },
        resolver: zodResolver(StudioWhyUsZodSchema),
        mode: "onChange",
    });

    const lineFields = useFieldArray({
        control: whyUsForm.control,
        name: "lines",
    });

    useEffect(() => {
        void get();
    }, [get, language]);

    useEffect(() => {
        if (!currentData?.lines?.length) {
            whyUsForm.reset({ description: "", lines: [defaultLine] });
            return;
        }
        whyUsForm.reset({
            description: currentData.description ?? "",
            lines: currentData.lines.map((line) => ({
                icon: line.icon ?? "",
                line: line.line ?? "",
            })),
        });
    }, [currentData, whyUsForm]);

    const onSubmit = async (formData: StudioWhyUsFormValues) => {
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
                </div>
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <FormProvider {...whyUsForm}>
            <form onSubmit={whyUsForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                <CommonLanguageSwitcherCheckbox />
                <div className="space-y-1 text-white">
                    <h1 className="text-2xl font-semibold text-white">Studio Why Us</h1>
                    <p className="text-sm text-white/70">Add why-us lines and description</p>
                </div>
                <Field>
                    <FieldLabel htmlFor="studio-why-us-description" className="text-white/80">
                        Description <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <Textarea
                            id="studio-why-us-description"
                            placeholder="Enter description"
                            className="min-h-28 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                            {...whyUsForm.register("description")}
                        />
                        <FieldError errors={[whyUsForm.formState.errors.description]} />
                    </FieldContent>
                </Field>
                <div className="space-y-6">
                    {lineFields.fields.map((field, index) => (
                        <div key={field.id} className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white">Line {index + 1}</h2>
                                <Button
                                    type="button"
                                    className="bg-white/10 text-white hover:bg-white/20"
                                    disabled={lineFields.fields.length <= 1}
                                    onClick={() => lineFields.remove(index)}
                                >
                                    Remove
                                </Button>
                            </div>
                            <FieldGroup className="grid gap-4 md:grid-cols-2">
                                <Field>
                                    <FieldLabel htmlFor={`studio-why-us-icon-${index}`} className="text-white/80">
                                        Icon <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`studio-why-us-icon-${index}`}
                                            placeholder="Icon name"
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...whyUsForm.register(`lines.${index}.icon`)}
                                        />
                                        <FieldError errors={[whyUsForm.formState.errors.lines?.[index]?.icon]} />
                                    </FieldContent>
                                </Field>
                                <Field className="md:col-span-2">
                                    <FieldLabel htmlFor={`studio-why-us-line-${index}`} className="text-white/80">
                                        Line <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            id={`studio-why-us-line-${index}`}
                                            placeholder="Enter line"
                                            className="min-h-20 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...whyUsForm.register(`lines.${index}.line`)}
                                        />
                                        <FieldError errors={[whyUsForm.formState.errors.lines?.[index]?.line]} />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </div>
                    ))}
                </div>
                <Button
                    type="button"
                    className="bg-white/10 text-white hover:bg-white/20"
                    onClick={() => lineFields.append(defaultLine)}
                >
                    Add line
                </Button>
                <Button
                    type="submit"
                    className="w-full bg-white/90 text-black hover:bg-white"
                    disabled={getLoading || updateLoading || !whyUsForm.formState.isValid}
                >
                    {updateLoading ? "Saving..." : "Save"}
                </Button>
            </form>
        </FormProvider>
    );
};

export default StudioWhyUs;

