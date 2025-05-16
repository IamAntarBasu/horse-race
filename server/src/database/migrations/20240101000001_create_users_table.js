exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('username', 50).notNullable().unique();
    table.string('email', 100).notNullable().unique();
    table.string('password', 255).notNullable();
    table.string('first_name', 50);
    table.string('last_name', 50);
    table.string('phone', 20);
    table.enum('role', ['user', 'admin']).defaultTo('user');
    table.boolean('is_active').defaultTo(true);
    table.string('profile_picture', 255);
    table.timestamp('last_login');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
}; 