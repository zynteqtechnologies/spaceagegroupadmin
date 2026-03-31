// types/team.ts

export interface TeamMember {
    _id?: string;
    name: string;
    position: string;
    study: string;
    experience: string;
    description: string;
    relationToGroup: string;
    image: {
        url: string;
        cloudinaryId: string;
    };
    socialLinks: {
        linkedin?: string;
        instagram?: string;
        facebook?: string;
    };
    order: number;
    createdAt?: string;
    updatedAt?: string;
}
