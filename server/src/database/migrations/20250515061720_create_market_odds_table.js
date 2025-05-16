exports.up = function(knex) {
  return knex.schema.createTable('market_odds', function(table) {
    table.increments('id').primary();
    table.string('market_id').notNullable();
    table.string('runner_id').notNullable();
    table.decimal('back_odds', 10, 2);
    table.decimal('back_size', 14, 2);
    table.decimal('lay_odds', 10, 2);
    table.decimal('lay_size', 14, 2);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['market_id', 'runner_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('market_odds');
}; 