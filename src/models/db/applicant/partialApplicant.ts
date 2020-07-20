import { Entity, PrimaryColumn, Column, BeforeUpdate } from 'typeorm';
@Entity()
export class PartialApplicant {
	@PrimaryColumn()
	public authId!: string;

	@Column('json')
	public partialApplication!: Record<string, string>;

	@Column('datetime', { 'nullable': false, 'default': () => 'CURRENT_TIMESTAMP' })
	public lastModified!: Date;

	@BeforeUpdate()
	public updateLastModifiedDate() {
		this.lastModified = new Date();
	}
}
