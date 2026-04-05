'use client';

import { useState, useRef } from 'react';
import {
  X, Upload, Image, Type, CheckCircle, AlertCircle, Loader2, ChevronRight, ShoppingCart
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Upload a single image file to backend ────────────────────
async function uploadImageField(fieldId, file) {
  const fd = new FormData();
  fd.append(fieldId, file);
  const { data } = await api.post('/cart/upload-customization', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data?.uploads?.[fieldId] || null;
}

// ─── Image Upload Field ───────────────────────────────────────
function ImageUploadField({ field, value, onChange, uploading, setUploading }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(value?.value || null);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }
    setError('');
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading((u) => ({ ...u, [field.fieldId]: true }));
    try {
      const url = await uploadImageField(field.fieldId, file);
      if (url) {
        onChange({ type: 'image_upload', label: field.label, isRequired: field.isRequired, value: url });
        URL.revokeObjectURL(objectUrl);
        setPreview(url);
      }
    } catch (e) {
      setError('Upload failed — try again');
      setPreview(null);
    } finally {
      setUploading((u) => ({ ...u, [field.fieldId]: false }));
    }
  };

  const isUploading = uploading[field.fieldId];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Drop zone */}
      <div
        onClick={() => !isUploading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${value?.value ? 'var(--primary)' : error ? '#ef4444' : 'var(--border)'}`,
          borderRadius: 12,
          padding: preview ? 0 : '20px 16px',
          textAlign: 'center',
          cursor: isUploading ? 'wait' : 'pointer',
          background: value?.value
            ? 'transparent'
            : 'var(--bg-elevated)',
          transition: 'all 0.2s',
          overflow: 'hidden',
          position: 'relative',
          minHeight: preview ? 120 : 'auto',
        }}
      >
        {isUploading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 10, zIndex: 2,
          }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} color="white" />
          </div>
        )}
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="preview"
              style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              padding: '4px 8px 6px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>
                <CheckCircle size={11} style={{ marginRight: 4 }} />Uploaded ✓
              </span>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Click to change</span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, background: 'var(--bg-hover)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Upload size={20} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Click to upload image
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              JPG, PNG, WebP · Max 5 MB
            </div>
            {field.placeholder && (
              <div style={{ fontSize: 11, color: 'var(--primary)', fontStyle: 'italic', maxWidth: 260 }}>
                {field.placeholder}
              </div>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontSize: 12 }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}
    </div>
  );
}

// ─── Text Input Field ─────────────────────────────────────────
function TextInputField({ field, value, onChange }) {
  const current = value?.value || '';
  const max = field.maxLength || 200;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <textarea
        style={{
          width: '100%', minHeight: 72, padding: '10px 12px', resize: 'vertical',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 10, color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.5,
          outline: 'none', fontFamily: 'inherit',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        value={current}
        onChange={(e) => onChange({
          type: 'text_input',
          label: field.label,
          isRequired: field.isRequired,
          value: e.target.value,
        })}
        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
        maxLength={max}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {field.placeholder && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {field.placeholder}
          </span>
        )}
        <span style={{
          fontSize: 11, color: current.length >= max * 0.9 ? '#f59e0b' : 'var(--text-muted)',
          marginLeft: 'auto',
        }}>
          {current.length}/{max}
        </span>
      </div>
    </div>
  );
}

// ─── Main Customization Modal ─────────────────────────────────
export default function CustomizationModal({ product, quantity, onClose, onConfirm }) {
  const fields = (product.customizationOptions || [])
    .slice()
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const [customization, setCustomization] = useState({});
  const [uploading, setUploading] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const setFieldValue = (fieldId, val) => {
    setCustomization((prev) => ({ ...prev, [fieldId]: val }));
    setErrors((e) => ({ ...e, [fieldId]: null }));
  };

  const anyUploading = Object.values(uploading).some(Boolean);

  const validate = () => {
    const errs = {};
    for (const field of fields) {
      if (!field.isRequired) continue;
      const val = customization[field.fieldId];
      if (!val || !val.value) {
        errs[field.fieldId] = `${field.label} is required`;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (anyUploading) {
      toast.error('Please wait for all uploads to finish');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(customization);
    } finally {
      setSubmitting(false);
    }
  };

  const requiredCount = fields.filter((f) => f.isRequired).length;
  const filledCount = fields.filter((f) => customization[f.fieldId]?.value).length;
  const progress = fields.length > 0 ? Math.round((filledCount / fields.length) * 100) : 0;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 20, width: '100%', maxWidth: 560,
        maxHeight: '92vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        border: '1px solid var(--border)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(16,185,129,0.04) 100%)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>✏️</span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Personalise Your Order
                </h2>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 360 }}>
                {product.name} — fill in the details below before adding to your cart.
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                background: 'var(--bg-hover)', cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {filledCount} of {fields.length} field{fields.length !== 1 ? 's' : ''} filled
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: progress === 100 ? 'var(--success)' : 'var(--primary)',
              }}>
                {progress}%
              </span>
            </div>
            <div style={{
              height: 6, background: 'var(--bg-hover)', borderRadius: 99, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: progress === 100
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, var(--primary), #818cf8)',
                borderRadius: 99, transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Fields */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
          {fields.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <CheckCircle size={32} style={{ marginBottom: 8 }} />
              <p>No customization needed for this product.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {fields.map((field) => {
                const hasError = errors[field.fieldId];
                const isFilled = customization[field.fieldId]?.value;
                return (
                  <div key={field.fieldId}>
                    {/* Field label row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      {/* Type icon */}
                      <div style={{
                        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                        background: field.type === 'image_upload'
                          ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                        color: field.type === 'image_upload' ? '#818cf8' : '#34d399',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {field.type === 'image_upload' ? <Image size={14} /> : <Type size={14} />}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                        {field.label}
                      </span>
                      {field.isRequired ? (
                        <span style={{ color: '#ef4444', fontSize: 13 }}>*</span>
                      ) : (
                        <span style={{
                          fontSize: 10, color: 'var(--text-muted)',
                          background: 'var(--bg-hover)', borderRadius: 4, padding: '1px 6px',
                        }}>optional</span>
                      )}
                      {isFilled && !uploading[field.fieldId] && (
                        <CheckCircle size={14} color="var(--success)" style={{ marginLeft: 'auto' }} />
                      )}
                    </div>

                    {/* Field input */}
                    {field.type === 'image_upload' ? (
                      <ImageUploadField
                        field={field}
                        value={customization[field.fieldId]}
                        onChange={(val) => setFieldValue(field.fieldId, val)}
                        uploading={uploading}
                        setUploading={setUploading}
                      />
                    ) : (
                      <TextInputField
                        field={field}
                        value={customization[field.fieldId]}
                        onChange={(val) => setFieldValue(field.fieldId, val)}
                      />
                    )}

                    {hasError && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        color: '#ef4444', fontSize: 12, marginTop: 6,
                      }}>
                        <AlertCircle size={12} /> {hasError}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          flexShrink: 0,
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {requiredCount > 0 ? `${requiredCount} required field${requiredCount !== 1 ? 's' : ''}` : 'All fields optional'}
              {' · '}Qty: {quantity}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || anyUploading}
            style={{
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, var(--primary), #818cf8)',
              color: 'white', cursor: submitting || anyUploading ? 'wait' : 'pointer',
              fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
              opacity: submitting || anyUploading ? 0.7 : 1, transition: 'opacity 0.2s',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            }}
          >
            {submitting ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Adding…</>
            ) : anyUploading ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</>
            ) : (
              <><ShoppingCart size={16} /> Add to Cart</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
