import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import { useEffect, useMemo } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeTestimonialsStore } from "@/shared/hooks/store/home/useHomeTestimonialsStore";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";

const fileSchema = z.any().refine((file) => !file || file instanceof File, {
    message: "Avatar must be a file",
});

export const TestimonialsZodValidationSchema = z.object({
    testimonials: z.array(
        z.object({
            name: z.string().min(3, "Name is required"),
            title: z.string().optional(),
            message: z.string().min(10, "Message is required"),
            rating: z.number().min(1).max(5),
            avatarFile: fileSchema.optional(),
        })
    ).min(1),
})

type TestimonialsFormValues = z.infer<typeof TestimonialsZodValidationSchema>;

const defaultTestimonials: TestimonialsFormValues["testimonials"] = [
    {
        name: "",
        title: "",
        message: "",
        rating: 5,
        avatarFile: undefined,
    },
];

type AvatarUploaderProps = {
    control: ReturnType<typeof useForm<TestimonialsFormValues>>["control"];
    name: `testimonials.${number}.avatarFile`;
    inputId: string;
    existingUrl?: string;
};

const AvatarUploader = ({ control, name, inputId, existingUrl }: AvatarUploaderProps) => {
    const file = useWatch({ control, name });
    const objectUrl = useMemo(() => {
        if (file instanceof File) {
            return URL.createObjectURL(file);
        }

        return null;
    }, [file]);

    useEffect(() => {
        if (!objectUrl) {
            return undefined;
        }

        return () => URL.revokeObjectURL(objectUrl);
    }, [objectUrl]);

    const previewUrl = objectUrl ?? existingUrl ?? null;

    return (
        <Controller
            control={control}
            name={name}
            render={({ field: controllerField }) => (
                <div className="flex items-center gap-4">
                    <label
                        htmlFor={inputId}
                        className="relative flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-white/30 bg-white/5 text-xs text-white/70 transition hover:bg-white/10"
                    >
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Avatar preview"
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        ) : (
                            <>
                                <Upload size={22} className="text-white/70" />
                                <span className="text-center">Upload avatar image</span>
                            </>
                        )}
                    </label>
                    <span className="text-xs text-white/60">
                        {controllerField.value instanceof File
                            ? controllerField.value.name
                            : existingUrl
                                ? "Current avatar"
                                : "PNG, JPG up to 5MB"}
                    </span>
                    <input
                        id={inputId}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                            const selectedFile = event.target.files?.[0];
                            controllerField.onChange(selectedFile ?? undefined);
                        }}
                    />
                </div>
            )}
        />
    );
};

const TestimonialsPage = () => {
    const { data: testimonialsData, get, update, getLoading, updateLoading } = useHomeTestimonialsStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const testimonialsForm = useForm<TestimonialsFormValues>({
        defaultValues: {
            testimonials: defaultTestimonials,
        },
        resolver: zodResolver(TestimonialsZodValidationSchema),
        mode: "onChange",
    })

    const testimonialFields = useFieldArray({
        control: testimonialsForm.control,
        name: "testimonials",
    })

    useEffect(() => {
        void get();
    }, [get, language]);

    useEffect(() => {
        if (!testimonialsData || testimonialsData.length === 0) {
            testimonialsForm.reset({ testimonials: defaultTestimonials });
            return;
        }
        testimonialsForm.reset({
            testimonials: testimonialsData.map((item) => ({
                name: item.name ?? "",
                title: item.title ?? "",
                message: item.message ?? "",
                rating: item.rating ?? 5,
                avatarFile: undefined,
            })),
        });
    }, [testimonialsData, testimonialsForm]);

    const onSubmit = async (formData: TestimonialsFormValues) => {
        const payload = formData.testimonials.map((item) => ({
            name: item.name,
            title: item.title,
            message: item.message,
            rating: item.rating,
            avatarFile: item.avatarFile,
        }));
        await update(payload);
    }

    if (getLoading) {
        return (
            <div className={cn("space-y-4", isRtl && "home-rtl")}>
                <CommonLanguageSwitcherCheckbox />
                <div className="space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                    <Skeleton className="h-24 w-24 rounded-2xl" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <FormProvider {...testimonialsForm}>
            <form onSubmit={testimonialsForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                <CommonLanguageSwitcherCheckbox />
                <div className="space-y-1 text-white">
                    <h1 className="text-2xl font-semibold text-white">Testimonials</h1>
                    <p className="text-sm text-white/70">Add testimonials with avatar uploads</p>
                </div>
                <div className="space-y-6">
                    {testimonialFields.fields.map((field, index) => (
                        <div key={field.id} className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white">Testimonial {index + 1}</h2>
                                <Button
                                    type="button"
                                    className="bg-white/10 text-white hover:bg-white/20"
                                    disabled={testimonialFields.fields.length <= 1}
                                    onClick={() => testimonialFields.remove(index)}
                                >
                                    Remove
                                </Button>
                            </div>
                            <FieldGroup className="grid gap-4 md:grid-cols-2">
                                <Field className="md:col-span-2">
                                    <FieldLabel htmlFor={`avatar-${index}`} className="text-white/80">
                                        Avatar
                                    </FieldLabel>
                                    <FieldContent>
                                        <AvatarUploader
                                            control={testimonialsForm.control}
                                            name={`testimonials.${index}.avatarFile`}
                                            inputId={`avatar-${index}`}
                                            existingUrl={testimonialsData?.[index]?.avatar?.url}
                                        />
                                        <FieldError errors={[testimonialsForm.formState.errors.testimonials?.[index]?.avatarFile]} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor={`name-${index}`} className="text-white/80">
                                        Name <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`name-${index}`}
                                            placeholder="Enter name"
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...testimonialsForm.register(`testimonials.${index}.name`)}
                                        />
                                        <FieldError errors={[testimonialsForm.formState.errors.testimonials?.[index]?.name]} />
                                    </FieldContent>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor={`title-${index}`} className="text-white/80">
                                        Title (optional)
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`title-${index}`}
                                            placeholder="Customer"
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...testimonialsForm.register(`testimonials.${index}.title`)}
                                        />
                                    </FieldContent>
                                </Field>
                                <Field className="md:col-span-2">
                                    <FieldLabel htmlFor={`rating-${index}`} className="text-white/80">
                                        Rating (1-5) <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id={`rating-${index}`}
                                            type="number"
                                            min={1}
                                            max={5}
                                            className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...testimonialsForm.register(`testimonials.${index}.rating`, { valueAsNumber: true })}
                                        />
                                        <FieldError errors={[testimonialsForm.formState.errors.testimonials?.[index]?.rating]} />
                                    </FieldContent>
                                </Field>
                                <Field className="md:col-span-2">
                                    <FieldLabel htmlFor={`message-${index}`} className="text-white/80">
                                        Message <span className="text-white">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Textarea
                                            id={`message-${index}`}
                                            placeholder="Enter testimonial message"
                                            className="min-h-24 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                            {...testimonialsForm.register(`testimonials.${index}.message`)}
                                        />
                                        <FieldError errors={[testimonialsForm.formState.errors.testimonials?.[index]?.message]} />
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col gap-3 md:flex-row">
                    <Button
                        type="button"
                        className="bg-white/10 text-white hover:bg-white/20 flex-1"
                        onClick={() =>
                            testimonialFields.append({
                                name: "",
                                title: "",
                                message: "",
                                rating: 5,
                                avatarFile: undefined,
                            })
                        }
                    >
                        Add testimonial
                    </Button>
                    <Button
                        type="submit"
                        className="flex-4 bg-white/90 text-black hover:bg-white"
                        disabled={getLoading || updateLoading || !testimonialsForm.formState.isValid}
                    >
                        {updateLoading ? "Saving..." : "Save"}
                    </Button>
                </div>
            </form>
        </FormProvider>
    )
}

export default TestimonialsPage;