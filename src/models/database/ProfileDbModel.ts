export interface ProfileDbRow {
    id: number;
    name: string;
    description: string;
    SystemAdministrator: boolean;
    isActive: boolean;
    createdBy: number;
    updatedBy: number;
}
