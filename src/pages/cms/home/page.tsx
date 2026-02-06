import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useFormState } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeHeroStore } from "@/shared/hooks/store/home/useHomeHeroStore";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import clsx from "clsx";

export const HeroZodValidationSchema = z.object({
    title: z.array(z.string().trim().min(1, "Title is required")).length(6, "All six title words are required"),
    description: z
        .string()
        .trim()
        .min(1, "Description is required")
        .min(10, "Description must be at least 10 characters"),
})

type HeroFormValues = z.infer<typeof HeroZodValidationSchema>;

const HeroPage = () => {
    const get = useHomeHeroStore((state) => state.get);
    const update = useHomeHeroStore((state) => state.update);
    const getLoading = useHomeHeroStore((state) => state.getLoading);
    const updateLoading = useHomeHeroStore((state) => state.updateLoading);

    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const heroForm = useForm<HeroFormValues>({
        defaultValues: {
            title: ["", "", "", "", "", ""],
            description: "",
        },
        resolver: zodResolver(HeroZodValidationSchema),
        mode: "onChange",
    })

    const { reset } = heroForm;
    const { isDirty, dirtyFields, errors, isSubmitted } = useFormState({ control: heroForm.control });
    const isFormDirty = isDirty || Object.keys(dirtyFields).length > 0;
    const titleErrors = Array.isArray(errors.title) ? errors.title : [];
    const descriptionError = errors.description;

    useEffect(() => {
        let isActive = true;

        const load = async () => {
            setIsInitialLoad(true);
            const result = await get();
            if (!isActive) return;

            if (result) {
                reset({
                    title: result.title?.length === 6 ? result.title : ["", "", "", "", "", ""],
                    description: result.description ?? "",
                });
            } else {
                reset({
                    title: ["", "", "", "", "", ""],
                    description: "",
                });
            }
            setIsInitialLoad(false);
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, reset]);

    const onSubmit = async (formData: HeroFormValues) => {
        await update(formData);
    }

    const showLoading = getLoading || isInitialLoad;

    return (
        <FormProvider {...heroForm}>
            {showLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={heroForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <div className="space-y-1 text-white">
                        <h1 className="text-2xl font-semibold text-white">Hero Title</h1>
                        <p className="text-sm text-white/70">Add six title chunks (3 per row)</p>
                    </div>
                    <FieldGroup className="grid gap-4 md:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Field key={`title-${index}`}>
                                <FieldLabel htmlFor={`title-${index}`} className="text-white/80">
                                    Title chunk {index + 1} <span className="text-white">*</span> (required)
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id={`title-${index}`}
                                        placeholder={`Word ${index + 1}`}
                                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                        required
                                        {...heroForm.register(`title.${index}`)}
                                    />
                                </FieldContent>
                            </Field>
                        ))}
                    </FieldGroup>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="description" className="text-white/80">
                                Description <span className="text-white">*</span> (at least 10 characters)
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="description"
                                    placeholder="Enter description"
                                    className="min-h-28 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                    required
                                    {...heroForm.register("description")}
                                />
                            </FieldContent>
                        </Field>
                    </FieldGroup>
                    {isSubmitted && (titleErrors.some(Boolean) || !!descriptionError) ? (
                        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                            <p className="font-medium">Please fix the following fields:</p>
                            <ul className="mt-2 list-disc pl-5">
                                {titleErrors.map((error, index) =>
                                    error ? <li key={`hero-title-error-${index}`}>Title chunk {index + 1}</li> : null
                                )}
                                {descriptionError ? <li>Description</li> : null}
                            </ul>
                        </div>
                    ) : null}
                    <Button
                        type="submit"
                        className={clsx("w-full bg-white/90 text-black hover:bg-white")}
                        disabled={getLoading || updateLoading || !isFormDirty}
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
            <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={`hero-title-skeleton-${index}`} className="h-10 w-full" />
                ))}
            </div>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
}

export default HeroPage;