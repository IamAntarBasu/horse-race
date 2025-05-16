exports.up = function(knex) {
  return knex.schema.table('bets', function(table) {
    table.timestamp('placed_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.table('bets', function(table) {
    table.dropColumn('placed_at');
  });
}; 