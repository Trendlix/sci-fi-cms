import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeAboutStore } from "@/shared/hooks/store/home/useHomeAboutStore";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";

export const AboutZodValidationSchema = z.object({
    description: z.array(z.string().min(1, "Description is required")).length(5),
})

type AboutFormValues = z.infer<typeof AboutZodValidationSchema>;

const AboutPage = () => {
    const get = useHomeAboutStore((state) => state.get);
    const update = useHomeAboutStore((state) => state.update);
    const getLoading = useHomeAboutStore((state) => state.getLoading);
    const updateLoading = useHomeAboutStore((state) => state.updateLoading);

    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const aboutForm = useForm<AboutFormValues>({
        defaultValues: {
            description: ["", "", "", "", ""],
        },
        resolver: zodResolver(AboutZodValidationSchema),
        mode: "onChange",
    })

    const { reset } = aboutForm;

    useEffect(() => {
        let isActive = true;

        const load = async () => {
            setIsInitialLoad(true);
            const result = await get();
            if (!isActive) return;

            if (result) {
                reset({
                    description: result.description?.length === 5 ? result.description : ["", "", "", "", ""],
                });
            } else {
                reset({
                    description: ["", "", "", "", ""],
                });
            }
            setIsInitialLoad(false);
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, reset]);

    const onSubmit = async (formData: AboutFormValues) => {
        await update(formData);
    }

    const showLoading = getLoading || isInitialLoad;

    return (
        <FormProvider {...aboutForm}>
            {showLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={aboutForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <div className="space-y-1 text-white">
                        <h1 className="text-2xl font-semibold text-white">About Section</h1>
                        <p className="text-sm text-white/70">Add five description blocks</p>
                    </div>
                    <FieldGroup className="grid gap-4 md:grid-cols-2">
                        {(["s", "c", "i", "f", "i"] as const).map((label, index) => (
                            <Field key={`description-${index}`}>
                                <FieldLabel htmlFor={`description-${index}`} className="text-white/80">
                                    Description {index + 1} for letter <span className="font-bold uppercase">{label}</span> of the alphabet <span className="text-white">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Textarea
                                        required
                                        id={`description-${index}`}
                                        placeholder={`Enter description ${index + 1}`}
                                        className="min-h-24 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                        {...aboutForm.register(`description.${index}`)}
                                    />
                                    <FieldError errors={[aboutForm.formState.errors.description?.[index]]} />
                                </FieldContent>
                            </Field>
                        ))}
                    </FieldGroup>
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
    )
}

const LoadingSkeleton = ({ isRtl }: { isRtl: boolean }) => {
    return (
        <div className={cn("space-y-4", isRtl && "home-rtl")}>
            <CommonLanguageSwitcherCheckbox />
            <div className="space-y-2">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={`about-desc-skeleton-${index}`} className="h-24 w-full" />
                ))}
            </div>
            <Skeleton className="h-10 w-full" />
        </div>
    )
}

export default AboutPage;