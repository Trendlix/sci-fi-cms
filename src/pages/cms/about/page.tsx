import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import BasicRichEditor from "@/components/tiptap/BasicRichEditor";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useAboutStore } from "@/shared/hooks/store/about/useAboutStore";
import type { AboutPayload } from "@/shared/hooks/store/about/about.types";

export const AboutHeroZodSchema = z.object({
    title: z.array(z.string().min(1, "Title is required")).length(6),
    description: z.string().min(10, "Description is required"),
});

type AboutHeroFormValues = z.infer<typeof AboutHeroZodSchema>;

const AboutHero = () => {
    const { get, update, getLoading, updateLoading } = useAboutStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const heroForm = useForm<AboutHeroFormValues>({
        defaultValues: {
            title: ["", "", "", "", "", ""],
            description: "",
        },
        resolver: zodResolver(AboutHeroZodSchema),
        mode: "onChange",
    });

    const descriptionValue = useWatch({ control: heroForm.control, name: "description" });
    const { reset, clearErrors } = heroForm;

    useEffect(() => {
        let isActive = true;
        reset({
            title: ["", "", "", "", "", ""],
            description: "",
        });
        clearErrors();

        const load = async () => {
            setIsInitialLoad(true);
            const result = await get("hero") as AboutPayload["hero"] | null;
            if (!isActive) return;
            if (!result) {
                reset({
                    title: ["", "", "", "", "", ""],
                    description: "",
                });
                setIsInitialLoad(false);
                return;
            }
            reset({
                title: result.title?.length === 6 ? result.title : ["", "", "", "", "", ""],
                description: result.description ?? "",
            });
            setIsInitialLoad(false);
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, reset, clearErrors]);

    const onSubmit = async (formData: AboutHeroFormValues) => {
        await update("hero", formData);
    };

    const showLoading = getLoading || isInitialLoad;

    return (
        <FormProvider {...heroForm}>
            {showLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={heroForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <div className="space-y-1 text-white">
                        <h1 className="text-2xl font-semibold text-white">About Hero</h1>
                        <p className="text-sm text-white/70">Add the hero title and description</p>
                    </div>
                    <FieldGroup className="grid gap-4 md:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Field key={`about-hero-title-${index}`}>
                                <FieldLabel htmlFor={`about-hero-title-${index}`} className="text-white/80">
                                    Title chunk {index + 1} <span className="text-white">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id={`about-hero-title-${index}`}
                                        placeholder={`Word ${index + 1}`}
                                        className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                        {...heroForm.register(`title.${index}`)}
                                    />
                                    <FieldError errors={[heroForm.formState.errors.title?.[index]]} />
                                </FieldContent>
                            </Field>
                        ))}
                    </FieldGroup>
                    <FieldError errors={[heroForm.formState.errors.title as { message?: string } | undefined]} />
                    <Field>
                        <FieldLabel htmlFor="about-hero-description" className="text-white/80">
                            Description <span className="text-white">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <BasicRichEditor name="description" value={descriptionValue ?? ""} />
                            <FieldError errors={[heroForm.formState.errors.description]} />
                        </FieldContent>
                    </Field>
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
                    <Skeleton key={`about-hero-title-skeleton-${index}`} className="h-10 w-full" />
                ))}
            </div>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    );
};

export default AboutHero;