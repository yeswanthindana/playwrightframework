export interface FacilityDbRow {
    id: number;
    name: string;
    addressLineOne: string;
    addressLineTwo: string | null;
    city: string;
    state: string;
    country: string;
    pincode: string;
    timeregion: string;
    isActive: boolean;
}
