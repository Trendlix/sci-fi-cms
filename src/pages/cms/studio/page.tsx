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
import { useStudioHeroStore } from "@/shared/hooks/store/studio/useStudioHeroStore";

export const StudioHeroZodSchema = z.object({
    title: z.array(z.string().min(1, "Title is required")).length(6),
    description: z.string().min(10, "Description is required"),
});

type StudioHeroFormValues = z.infer<typeof StudioHeroZodSchema>;

const StudioHero = () => {
    const { data, get, update, getLoading, updateLoading } = useStudioHeroStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const currentData = data?.[language];
    const isReady = !getLoading && currentData !== undefined;
    const heroForm = useForm<StudioHeroFormValues>({
        defaultValues: {
            title: ["", "", "", "", "", ""],
            description: "",
        },
        resolver: zodResolver(StudioHeroZodSchema),
        mode: "onChange",
    });
    const descriptionValue = useWatch({ control: heroForm.control, name: "description" });

    useEffect(() => {
        heroForm.reset({
            title: ["", "", "", "", "", ""],
            description: "",
        });
        heroForm.clearErrors();
        void get();
    }, [get, language, heroForm]);

    useEffect(() => {
        if (currentData === undefined) {
            return;
        }
        if (!currentData) {
            heroForm.reset({
                title: ["", "", "", "", "", ""],
                description: "",
            });
            return;
        }
        heroForm.reset({
            title: currentData.title?.length === 6 ? currentData.title : ["", "", "", "", "", ""],
            description: currentData.description ?? "",
        });
    }, [currentData, heroForm]);

    const onSubmit = async (formData: StudioHeroFormValues) => {
        await update(formData);
    };

    return (
        <FormProvider {...heroForm}>
            {getLoading || !isReady ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={heroForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <div className="space-y-1 text-white">
                        <h1 className="text-2xl font-semibold text-white">Studio Hero</h1>
                        <p className="text-sm text-white/70">Add the hero title and description</p>
                    </div>
                    <FieldGroup className="grid gap-4 md:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Field key={`studio-hero-title-${index}`}>
                                <FieldLabel htmlFor={`studio-hero-title-${index}`} className="text-white/80">
                                    Title chunk {index + 1} <span className="text-white">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id={`studio-hero-title-${index}`}
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
                        <FieldLabel htmlFor="studio-hero-description" className="text-white/80">
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
                    <Skeleton key={`studio-hero-title-skeleton-${index}`} className="h-10 w-full" />
                ))}
            </div>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    );
};

export default StudioHero;

