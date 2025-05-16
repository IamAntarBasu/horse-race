exports.up = function(knex) {
  return knex.schema.createTable('balance', function(table) {
    table.increments('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.decimal('balance', 14, 2).defaultTo(0);
    table.decimal('exposure', 14, 2).defaultTo(0);
    table.decimal('previousbalance', 14, 2).defaultTo(0);
    table.decimal('previousexposure', 14, 2).defaultTo(0);
    table.timestamp('balance_updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('balance');
}; 