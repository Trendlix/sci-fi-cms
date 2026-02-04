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
import { useAboutStore } from "@/shared/hooks/store/about/useAboutStore";

export const AboutHeroZodSchema = z.object({
    title: z.array(z.string().min(1, "Title is required")).length(6),
    description: z.string().min(10, "Description is required"),
});

type AboutHeroFormValues = z.infer<typeof AboutHeroZodSchema>;

const AboutHero = () => {
    const { data, get, update, getLoading, updateLoading } = useAboutStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const currentData = data?.[language];
    const currentSection = currentData?.hero;
    const isReady = !getLoading && currentData !== undefined && currentSection !== undefined;
    const heroForm = useForm<AboutHeroFormValues>({
        defaultValues: {
            title: ["", "", "", "", "", ""],
            description: "",
        },
        resolver: zodResolver(AboutHeroZodSchema),
        mode: "onChange",
    });
    const descriptionValue = useWatch({ control: heroForm.control, name: "description" });

    useEffect(() => {
        heroForm.reset({
            title: ["", "", "", "", "", ""],
            description: "",
        });
        heroForm.clearErrors();
        void get("hero");
    }, [get, language, heroForm]);

    useEffect(() => {
        if (currentSection === undefined) {
            return;
        }
        if (!currentSection) {
            heroForm.reset({
                title: ["", "", "", "", "", ""],
                description: "",
            });
            return;
        }
        heroForm.reset({
            title: currentSection.title?.length === 6 ? currentSection.title : ["", "", "", "", "", ""],
            description: currentSection.description ?? "",
        });
    }, [currentSection, heroForm]);

    const onSubmit = async (formData: AboutHeroFormValues) => {
        await update("hero", formData);
    };

    return (
        <FormProvider {...heroForm}>
            {getLoading || !isReady ? (
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
                        disabled={getLoading || updateLoading || !heroForm.formState.isValid}
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