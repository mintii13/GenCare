import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalFacility extends Document {
  facility_code: string;
  name: string;
  
  // Location
  address: string;
  district?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  
  // Contact
  phone: string;
  email?: string;
  
  // Services & Features
  services?: string[]; // JSON array of services
  working_hours?: any; // JSON object of daily hours
  
  // Capacity
  max_daily_bookings: number;
  
  // Status
  is_active: boolean;
  rating?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const MedicalFacilitySchema: Schema = new Schema({
  facility_code: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // Location
  address: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  latitude: {
    type: Number,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180
  },
  
  // Contact
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  
  // Services & Features
  services: [{
    type: String,
    trim: true
  }],
  working_hours: {
    monday: {
      open: String,
      close: String,
      is_closed: { type: Boolean, default: false }
    },
    tuesday: {
      open: String,
      close: String,
      is_closed: { type: Boolean, default: false }
    },
    wednesday: {
      open: String,
      close: String,
      is_closed: { type: Boolean, default: false }
    },
    thursday: {
      open: String,
      close: String,
      is_closed: { type: Boolean, default: false }
    },
    friday: {
      open: String,
      close: String,
      is_closed: { type: Boolean, default: false }
    },
    saturday: {
      open: String,
      close: String,
      is_closed: { type: Boolean, default: false }
    },
    sunday: {
      open: String,
      close: String,
      is_closed: { type: Boolean, default: true }
    }
  },
  
  // Capacity
  max_daily_bookings: {
    type: Number,
    default: 50,
    min: 1
  },
  
  // Status
  is_active: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    set: (v: number) => Math.round(v * 100) / 100 // Round to 2 decimal places
  }
}, {
  timestamps: true,
  collection: 'medical_facilities'
});

// Indexes
MedicalFacilitySchema.index({ facility_code: 1 });
MedicalFacilitySchema.index({ city: 1 });
MedicalFacilitySchema.index({ is_active: 1 });
MedicalFacilitySchema.index({ location: '2dsphere' }); // For geospatial queries
MedicalFacilitySchema.index({ name: 'text' }); // Text search

// Create 2dsphere index for location
MedicalFacilitySchema.index({
  "location": "2dsphere"
});

// Virtual for location (GeoJSON format)
MedicalFacilitySchema.virtual('location').get(function() {
  if (this.latitude && this.longitude) {
    return {
      type: 'Point',
      coordinates: [this.longitude, this.latitude]
    };
  }
  return null;
});

// Static method to find active facilities
MedicalFacilitySchema.statics.findActive = function() {
  return this.find({ is_active: true }).sort({ name: 1 });
};

// Static method to find by city
MedicalFacilitySchema.statics.findByCity = function(city: string) {
  return this.find({ city: new RegExp(city, 'i'), is_active: true }).sort({ name: 1 });
};

// Static method to find nearby facilities
MedicalFacilitySchema.statics.findNearby = function(longitude: number, latitude: number, maxDistance: number = 10000) {
  return this.find({
    is_active: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // meters
      }
    }
  });
};

// Method to check if facility is open at specific time
MedicalFacilitySchema.methods.isOpenAt = function(date: Date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[date.getDay()];
  const daySchedule = this.working_hours?.[dayName];
  
  if (!daySchedule || daySchedule.is_closed) {
    return false;
  }
  
  const currentTime = date.getHours() * 100 + date.getMinutes();
  const openTime = parseInt(daySchedule.open.replace(':', ''));
  const closeTime = parseInt(daySchedule.close.replace(':', ''));
  
  return currentTime >= openTime && currentTime <= closeTime;
};

// Method to get available time slots for a specific date
MedicalFacilitySchema.methods.getAvailableTimeSlots = function(date: Date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[date.getDay()];
  const daySchedule = this.working_hours?.[dayName];
  
  if (!daySchedule || daySchedule.is_closed) {
    return [];
  }
  
  const timeSlots = [];
  const openHour = parseInt(daySchedule.open.split(':')[0]);
  const openMinute = parseInt(daySchedule.open.split(':')[1]);
  const closeHour = parseInt(daySchedule.close.split(':')[0]);
  const closeMinute = parseInt(daySchedule.close.split(':')[1]);
  
  let currentHour = openHour;
  let currentMinute = openMinute;
  
  while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
    timeSlots.push(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
    
    currentMinute += 30; // 30-minute slots
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour++;
    }
  }
  
  return timeSlots;
};

// Ensure virtual fields are serialized
MedicalFacilitySchema.set('toJSON', { virtuals: true });
MedicalFacilitySchema.set('toObject', { virtuals: true });

export default mongoose.model<IMedicalFacility>('MedicalFacility', MedicalFacilitySchema); 