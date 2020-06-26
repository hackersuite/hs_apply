import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Applicant } from '../applicant';

@Entity()
export class Review {
	@PrimaryGeneratedColumn('uuid')
	public id!: string;

	@ManyToOne(() => Applicant)
	public applicant!: Applicant;

	@Column()
	public createdByAuthID!: string;

	@Column()
	public averageScore!: number;

	@Column('datetime', { 'nullable': false, 'default': () => 'CURRENT_TIMESTAMP' })
	public createdAt!: Date;
}
