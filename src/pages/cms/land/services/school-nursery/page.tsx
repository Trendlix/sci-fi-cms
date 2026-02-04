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
import { useLandServicesSchoolNurseryStore } from "@/shared/hooks/store/land/useLandServicesSchoolNurseryStore";

const highlightSchema = z.object({
    icon: z.string().min(1),
    title: z.string().min(3),
    description: z.string().min(10),
});

export const LandSchoolNurseryZodSchema = z.object({
    schoolTrips: z.object({
        description: z.string().min(10),
        highlights: highlightSchema,
    }),
    nursery: z.object({
        description: z.string().min(10),
        highlights: highlightSchema,
    }),
});

type LandSchoolNurseryFormValues = z.infer<typeof LandSchoolNurseryZodSchema>;

const getEmptySchoolNurseryValues = (): LandSchoolNurseryFormValues => ({
    schoolTrips: {
        description: "",
        highlights: { icon: "", title: "", description: "" },
    },
    nursery: {
        description: "",
        highlights: { icon: "", title: "", description: "" },
    },
});

const LandSchoolNurseryService = () => {
    const { data, get, update, getLoading, updateLoading } = useLandServicesSchoolNurseryStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const currentData = data?.[language] ?? null;
    const form = useForm<LandSchoolNurseryFormValues>({
        defaultValues: getEmptySchoolNurseryValues(),
        resolver: zodResolver(LandSchoolNurseryZodSchema),
        mode: "onChange",
    });
    const schoolTripsValue = useWatch({ control: form.control, name: "schoolTrips" });
    const nurseryValue = useWatch({ control: form.control, name: "nursery" });

    useEffect(() => {
        void get();
    }, [get, language, form]);

    useEffect(() => {
        if (currentData === null) {
            return;
        }
        form.reset({
            schoolTrips: {
                description: currentData.schoolTrips.description ?? "",
                highlights: {
                    icon: currentData.schoolTrips.highlights.icon ?? "",
                    title: currentData.schoolTrips.highlights.line.title ?? "",
                    description: currentData.schoolTrips.highlights.line.description ?? "",
                },
            },
            nursery: {
                description: currentData.nursery.description ?? "",
                highlights: {
                    icon: currentData.nursery.highlights.icon ?? "",
                    title: currentData.nursery.highlights.line.title ?? "",
                    description: currentData.nursery.highlights.line.description ?? "",
                },
            },
        });
    }, [currentData, form]);

    const onSubmit = async (values: LandSchoolNurseryFormValues) => {
        await update({
            schoolTrips: {
                description: values.schoolTrips.description,
                highlights: {
                    icon: values.schoolTrips.highlights.icon,
                    line: {
                        title: values.schoolTrips.highlights.title,
                        description: values.schoolTrips.highlights.description,
                    },
                },
            },
            nursery: {
                description: values.nursery.description,
                highlights: {
                    icon: values.nursery.highlights.icon,
                    line: {
                        title: values.nursery.highlights.title,
                        description: values.nursery.highlights.description,
                    },
                },
            },
        });
    };

    const renderSection = (key: "schoolTrips" | "nursery", label: string) => {
        const sectionValue = key === "schoolTrips" ? schoolTripsValue : nurseryValue;
        return (
            <div className="space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
                <h2 className="text-lg font-semibold text-white">{label}</h2>
                <FieldGroup className="grid gap-4 md:grid-cols-2">
                    <Field className="md:col-span-2">
                        <FieldLabel htmlFor={`${key}-description`} className="text-white/80">
                            Description <span className="text-white">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <BasicRichEditor
                                name={`${key}.description`}
                                value={sectionValue?.description ?? ""}
                            />
                            <FieldError errors={[form.formState.errors[key]?.description]} />
                        </FieldContent>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor={`${key}-icon`} className="text-white/80">
                            Highlight icon <span className="text-white">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                id={`${key}-icon`}
                                placeholder="Icon"
                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                {...form.register(`${key}.highlights.icon`)}
                            />
                            <FieldError errors={[form.formState.errors[key]?.highlights?.icon]} />
                        </FieldContent>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor={`${key}-title`} className="text-white/80">
                            Highlight title <span className="text-white">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                id={`${key}-title`}
                                placeholder="Title"
                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                {...form.register(`${key}.highlights.title`)}
                            />
                            <FieldError errors={[form.formState.errors[key]?.highlights?.title]} />
                        </FieldContent>
                    </Field>
                    <Field className="md:col-span-2">
                        <FieldLabel htmlFor={`${key}-highlight-description`} className="text-white/80">
                            Highlight description <span className="text-white">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <BasicRichEditor
                                name={`${key}.highlights.description`}
                                value={sectionValue?.highlights?.description ?? ""}
                            />
                            <FieldError errors={[form.formState.errors[key]?.highlights?.description]} />
                        </FieldContent>
                    </Field>
                </FieldGroup>
            </div>
        );
    };

    return (
        <FormProvider {...form}>
            {getLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <div className="space-y-1 text-white">
                        <h1 className="text-2xl font-semibold text-white">School Trips & Nursery</h1>
                        <p className="text-sm text-white/70">Add school trips and nursery details</p>
                    </div>
                    {renderSection("schoolTrips", "School Trips")}
                    {renderSection("nursery", "Nursery")}
                    <Button
                        type="submit"
                        className="w-full bg-white/90 text-black hover:bg-white"
                        disabled={getLoading || updateLoading || !form.formState.isValid}
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
            <Skeleton className="h-10 w-full" />
        </div>
    );
};

export default LandSchoolNurseryService;

