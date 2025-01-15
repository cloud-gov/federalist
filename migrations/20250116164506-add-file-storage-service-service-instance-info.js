const TABLE_NAME = 'file_storage_service';
const SERVICE_NAME_COLUMN_NAME = 'serviceName';
const SERVICE_ID_COLUMN_NAME = 'serviceId';
const COLUMN_TYPE = {
  type: 'string',
  allowNull: true,
};

const SITE_ID_COLUMN_NAME = 'siteId';
const SITE_ID_UNIQUE_INDEX_NAME = `${TABLE_NAME}_unique_site_id_idx`;

const USER_ACTION_TABLE_NAME = 'file_storage_user_action';
const USER_ACTION_DESCRIPTION_COLUMN_NAME = 'description';
const USER_ACTION_DESCRIPTION_OLD_COLUMN_NAME = 'desciption';

exports.up = async (db) => {
  await db.addColumn(TABLE_NAME, SERVICE_NAME_COLUMN_NAME, COLUMN_TYPE);
  await db.addColumn(TABLE_NAME, SERVICE_ID_COLUMN_NAME, COLUMN_TYPE);
  await db.addIndex(TABLE_NAME, SITE_ID_UNIQUE_INDEX_NAME, SITE_ID_COLUMN_NAME, true);
  await db.renameColumn(
    USER_ACTION_TABLE_NAME,
    USER_ACTION_DESCRIPTION_OLD_COLUMN_NAME,
    USER_ACTION_DESCRIPTION_COLUMN_NAME,
  );
};

exports.down = async (db) => {
  await db.renameColumn(
    USER_ACTION_TABLE_NAME,
    USER_ACTION_DESCRIPTION_COLUMN_NAME,
    USER_ACTION_DESCRIPTION_OLD_COLUMN_NAME,
  );
  await db.removeIndex(TABLE_NAME, SITE_ID_UNIQUE_INDEX_NAME);
  await db.removeColumn(TABLE_NAME, SERVICE_NAME_COLUMN_NAME);
  await db.removeColumn(TABLE_NAME, SERVICE_ID_COLUMN_NAME);
};
