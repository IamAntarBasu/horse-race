exports.up = function(knex) {
  return knex.schema.createTable('bets', function(table) {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('market_id').notNullable();
    table.string('runner_id').notNullable();
    table.string('selection_name').notNullable();
    table.string('market_name').notNullable();
    table.enum('bet_type', ['back', 'lay']).notNullable();
    table.decimal('odds', 10, 2).notNullable();
    table.decimal('bet_amount', 10, 2).notNullable();
    table.decimal('potential_payout', 10, 2).notNullable();
    table.decimal('liability', 10, 2).notNullable();
    table.enum('status', ['open', 'matched', 'settled', 'cancelled']).notNullable().defaultTo('open');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('settled_at');
    table.decimal('settled_amount', 10, 2);
    table.string('settlement_status');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('bets');
}; 