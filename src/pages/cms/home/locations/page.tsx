import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLocationsStore } from "@/shared/hooks/store/home/useHomeLocationsStore";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";

export const LocationsZodValidationSchema = z.object({
    locations: z.array(
        z.object({
            title: z.string().min(3, "Title is required"),
            address: z.string().min(10, "Address is required"),
            mapUrl: z.string().url("Map URL must be valid"),
        })
    ).min(1),
});

type LocationsFormValues = z.infer<typeof LocationsZodValidationSchema>;

const defaultLocations: LocationsFormValues["locations"] = [
    {
        title: "",
        address: "",
        mapUrl: "",
    },
];

const LoadingSkeleton = ({ isRtl }: { isRtl: boolean }) => {
    return (
        <div className={cn("space-y-4", isRtl && "home-rtl")}>
            <CommonLanguageSwitcherCheckbox />
            <div className="space-y-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-64" />
            </div>
            <div className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
        </div>
    )
}

const LocationsPage = () => {
    const get = useHomeLocationsStore((state) => state.get);
    const update = useHomeLocationsStore((state) => state.update);
    const getLoading = useHomeLocationsStore((state) => state.getLoading);
    const updateLoading = useHomeLocationsStore((state) => state.updateLoading);

    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const locationsForm = useForm<LocationsFormValues>({
        defaultValues: {
            locations: defaultLocations,
        },
        resolver: zodResolver(LocationsZodValidationSchema),
        mode: "onChange",
    });

    const locationFields = useFieldArray({
        control: locationsForm.control,
        name: "locations",
    });

    const { reset } = locationsForm;

    useEffect(() => {
        let isActive = true;

        const load = async () => {
            setIsInitialLoad(true);
            const result = await get();
            if (!isActive) return;

            if (result && result.length > 0) {
                reset({
                    locations: result.map((item) => ({
                        title: item.title ?? "",
                        address: item.address ?? "",
                        mapUrl: item.mapUrl ?? "",
                    })),
                });
            } else {
                reset({ locations: defaultLocations });
            }
            setIsInitialLoad(false);
        };

        void load();
        return () => {
            isActive = false;
        };
    }, [get, language, reset]);

    const onSubmit = async (formData: LocationsFormValues) => {
        await update(formData.locations);
    };

    const showLoading = getLoading || isInitialLoad;

    return (
        <FormProvider {...locationsForm}>
            {showLoading ? (
                <LoadingSkeleton isRtl={isRtl} />
            ) : (
                <form onSubmit={locationsForm.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                    <CommonLanguageSwitcherCheckbox />
                    <div className="space-y-1 text-white">
                        <h1 className="text-2xl font-semibold text-white">Locations</h1>
                        <p className="text-sm text-white/70">Add the address details and map link</p>
                    </div>
                    <div className="space-y-6">
                        {locationFields.fields.map((field, index) => (
                            <div key={field.id} className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-white">Location {index + 1}</h2>
                                    <Button
                                        type="button"
                                        className="bg-white/10 text-white hover:bg-white/20"
                                        disabled={locationFields.fields.length <= 1}
                                        onClick={() => locationFields.remove(index)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                                <FieldGroup className="grid gap-4 md:grid-cols-2">
                                    <Field>
                                        <FieldLabel htmlFor={`title-${index}`} className="text-white/80">
                                            Title <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`title-${index}`}
                                                placeholder="Location title"
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...locationsForm.register(`locations.${index}.title`)}
                                            />
                                            <FieldError errors={[locationsForm.formState.errors.locations?.[index]?.title]} />
                                        </FieldContent>
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor={`map-url-${index}`} className="text-white/80">
                                            Map URL <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`map-url-${index}`}
                                                placeholder="https://maps.google.com/..."
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...locationsForm.register(`locations.${index}.mapUrl`)}
                                            />
                                            <FieldError errors={[locationsForm.formState.errors.locations?.[index]?.mapUrl]} />
                                        </FieldContent>
                                    </Field>
                                    <Field className="md:col-span-2">
                                        <FieldLabel htmlFor={`address-${index}`} className="text-white/80">
                                            Address <span className="text-white">*</span>
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={`address-${index}`}
                                                placeholder="Enter address"
                                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                                {...locationsForm.register(`locations.${index}.address`)}
                                            />
                                            <FieldError errors={[locationsForm.formState.errors.locations?.[index]?.address]} />
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
                                locationFields.append({
                                    title: "",
                                    address: "",
                                    mapUrl: "",
                                })
                            }
                        >
                            Add location
                        </Button>
                        <Button
                            type="submit"
                            className="bg-white/90 text-black hover:bg-white flex-4"
                            disabled={getLoading || updateLoading || !locationsForm.formState.isValid}
                        >
                            {updateLoading ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </form>
            )}
        </FormProvider>
    );
};

export default LocationsPage;