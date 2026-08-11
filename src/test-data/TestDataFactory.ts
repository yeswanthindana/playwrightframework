import { faker } from '@faker-js/faker';

export class FakerUtil {
    static fullName(): string {
        return `${faker.person.firstName()} ${faker.person.lastName()}`;
    }

    static memberEmail(): string {
        return faker.internet.email().toLowerCase();
    }

    static profileName(): string {
        return faker.person.jobTitle();
    }

    static profileDescription(): string {
        return faker.person.jobDescriptor();
    }
}
