import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeHeroStore } from "@/shared/hooks/store/home/useHomeHeroStore";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";

export const HeroZodValidationSchema = z.object({
    title: z.array(z.string().min(1, "Title is required")).length(6),
    description: z.string().min(10),
})

type HeroFormValues = z.infer<typeof HeroZodValidationSchema>;

const HeroPage = () => {
    const { data, get, update, getLoading, updateLoading } = useHomeHeroStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const heroForm = useForm<HeroFormValues>({
        defaultValues: {
            title: ["", "", "", "", "", ""],
            description: "",
        },
        resolver: zodResolver(HeroZodValidationSchema),
        mode: "onChange",
    })

    useEffect(() => {
        void get();
    }, [get, language, heroForm]);


    useEffect(() => {
        if (!data) return;
        heroForm.reset({
            title: data.title?.length === 6 ? data.title : ["", "", "", "", "", ""],
            description: data.description ?? "",
        });
    }, [data, heroForm]);

    const onSubmit = async (formData: HeroFormValues) => {
        await update(formData);
    }


    return (
        <FormProvider {...heroForm}>
            {getLoading ? (
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
                                    Title chunk {index + 1} <span className="text-white">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id={`title-${index}`}
                                        placeholder={`Word ${index + 1}`}
                                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                        {...heroForm.register(`title.${index}`)}
                                    />
                                    <FieldError errors={[heroForm.formState.errors.title?.[index]]} />
                                </FieldContent>
                            </Field>
                        ))}
                    </FieldGroup>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="description" className="text-white/80">
                                Description <span className="text-white">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="description"
                                    placeholder="Enter description"
                                    className="min-h-28 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                    {...heroForm.register("description")}
                                />
                                <FieldError errors={[heroForm.formState.errors.description]} />
                            </FieldContent>
                        </Field>
                    </FieldGroup>
                    <Button
                        type="submit"
                        className="w-full bg-white/90 text-black hover:bg-white"
                        disabled={getLoading || updateLoading || !heroForm.formState.isValid}
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