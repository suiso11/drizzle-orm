import { describe, expect, it } from 'vitest';
import { aliasedTable } from '~/alias.ts';
import {
	integer as pgInteger,
	pgTable,
	pgView,
	QueryBuilder as PgQueryBuilder,
	text as pgText,
} from '~/pg-core/index.ts';
import { eq, sql } from '~/sql/index.ts';
import {
	integer as sqliteInteger,
	QueryBuilder as SQLiteQueryBuilder,
	sqliteTable,
	sqliteView,
	text as sqliteText,
} from '~/sqlite-core/index.ts';

describe('aliased view with aliased SQL fields', () => {
	it('pg: qualifies the SQL field with the view alias', () => {
		const airports = pgTable('airports', { id: pgInteger().primaryKey(), code: pgText().notNull() });
		const airportView = pgView('airport_view').as((qb) =>
			qb.select({ id: airports.id, code: sql<string>`upper(${airports.code})`.as('code') }).from(airports)
		);
		const destination = aliasedTable(airportView, 'destination');

		const query = new PgQueryBuilder().select().from(destination).where(eq(destination.code, 'SEA')).orderBy(
			destination.code,
		);

		expect(query.toSQL().sql).toBe(
			'select "id", "code" from "airport_view" "destination" where "destination"."code" = $1 order by "destination"."code"',
		);
	});

	it('pg: keeps the original view and its alias apart in a join', () => {
		const airports = pgTable('airports', { id: pgInteger().primaryKey(), code: pgText().notNull() });
		const airportView = pgView('airport_view').as((qb) =>
			qb.select({ id: airports.id, code: sql<string>`upper(${airports.code})`.as('code') }).from(airports)
		);
		const destination = aliasedTable(airportView, 'destination');

		const query = new PgQueryBuilder().select({ origin: airportView.code, destination: destination.code })
			.from(airportView)
			.innerJoin(destination, eq(destination.id, airportView.id))
			.where(eq(destination.code, 'SEA'));

		expect(query.toSQL().sql).toBe(
			'select "airport_view"."code", "destination"."code" from "airport_view" inner join "airport_view" "destination" on "destination"."id" = "airport_view"."id" where "destination"."code" = $1',
		);
	});

	it('sqlite: qualifies the SQL field with the view alias', () => {
		const airports = sqliteTable('airports', { id: sqliteInteger().primaryKey(), code: sqliteText().notNull() });
		const airportView = sqliteView('airport_view').as((qb) =>
			qb.select({ id: airports.id, code: sql<string>`upper(${airports.code})`.as('code') }).from(airports)
		);
		const destination = aliasedTable(airportView, 'destination');

		const query = new SQLiteQueryBuilder().select().from(destination).where(eq(destination.code, 'SEA'));

		expect(query.toSQL().sql).toBe(
			'select "id", "code" from "airport_view" "destination" where "destination"."code" = ?',
		);
	});
});
