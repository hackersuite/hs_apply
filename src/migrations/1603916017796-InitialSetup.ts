import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSetup1603916017796 implements MigrationInterface {
	name = 'InitialSetup1603916017796';

	public async up(queryRunner: QueryRunner): Promise<any> {
		await queryRunner.query('CREATE TABLE `partial_applicant` (`authId` varchar(255) NOT NULL, `partialApplication` json NOT NULL, `lastModified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`authId`)) ENGINE=InnoDB', undefined);
		await queryRunner.query('CREATE TABLE `review` (`id` varchar(36) NOT NULL, `createdByAuthID` varchar(255) NOT NULL, `averageScore` int NOT NULL, `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, `applicantId` varchar(36) NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB', undefined);
		await queryRunner.query("CREATE TABLE `applicant` (`id` varchar(36) NOT NULL, `authId` varchar(255) NULL, `age` int NOT NULL, `gender` varchar(255) NOT NULL, `nationality` varchar(255) NULL, `country` varchar(255) NOT NULL, `city` varchar(255) NOT NULL, `university` varchar(255) NOT NULL, `degree` varchar(255) NOT NULL, `yearOfStudy` varchar(255) NOT NULL, `cv` varchar(255) NULL, `workArea` varchar(255) NULL, `skills` varchar(255) NULL, `hackathonCount` int NULL, `whyChooseHacker` text NULL, `pastProjects` text NULL, `hardwareRequests` text NULL, `dietaryRequirements` varchar(255) NOT NULL, `tShirtSize` varchar(255) NOT NULL, `hearAbout` varchar(255) NOT NULL, `inviteAcceptDeadline` datetime NULL, `applicationStatus` enum ('0', '1', '2', '3', '4', '5', '6', '7') NOT NULL DEFAULT '1', `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE INDEX `IDX_1190863787a09bdc332796d622` (`authId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
		await queryRunner.query('ALTER TABLE `review` ADD CONSTRAINT `FK_530b8666ff790e4e0e00bb41669` FOREIGN KEY (`applicantId`) REFERENCES `applicant`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION', undefined);
	}

	public async down(queryRunner: QueryRunner): Promise<any> {
		await queryRunner.query('ALTER TABLE `review` DROP FOREIGN KEY `FK_530b8666ff790e4e0e00bb41669`', undefined);
		await queryRunner.query('DROP INDEX `IDX_1190863787a09bdc332796d622` ON `applicant`', undefined);
		await queryRunner.query('DROP TABLE `applicant`', undefined);
		await queryRunner.query('DROP TABLE `review`', undefined);
		await queryRunner.query('DROP TABLE `partial_applicant`', undefined);
	}
}
