import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials are missing. Authentication will not work properly.');

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    email?: string;
  };

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });

export async function signUpWithEmail(email: string, password: string, metadata?: object) {
  return supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: metadata

export async function signInWithOAuth(provider: 'google' | 'facebook' | 'apple') {
  return supabase.auth.signInWithOAuth({ 
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`

export async function signOut() {
  return supabase.auth.signOut();

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
