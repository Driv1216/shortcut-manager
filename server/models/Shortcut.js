import mongoose from 'mongoose';

const shortcutSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    keys: {
      type: String,
      required: true,
      trim: true
    },
    normalizedKeys: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    category: {
      type: String,
      default: 'Custom',
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      required: true
    },
    updatedAt: {
      type: Date,
      required: true
    }
  },
  {
    versionKey: false
  }
);

shortcutSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret.id || String(ret._id);
    delete ret._id;
    return ret;
  }
});

export const Shortcut =
  mongoose.models.Shortcut || mongoose.model('Shortcut', shortcutSchema);
