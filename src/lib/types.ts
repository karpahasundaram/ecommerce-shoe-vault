// Hand-written to match supabase/schema.sql. If you later install the Supabase
// CLI you can regenerate this with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/types.ts

export type OrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "shipped"
  | "delivered";

export interface ShippingAddress {
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

type Timestamps = { created_at: string };

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          image_url: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          slug: string;
          name: string;
          description: string;
          price: number;
          is_featured: boolean;
          is_active: boolean;
          updated_at: string;
        } & Timestamps;
        Insert: {
          id?: string;
          category_id: string;
          slug: string;
          name: string;
          description?: string;
          price: number;
          is_featured?: boolean;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt: string | null;
          position: number;
          is_primary: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt?: string | null;
          position?: number;
          is_primary?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string;
          stock_quantity: number;
          sku: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          product_id: string;
          size: string;
          stock_quantity?: number;
          sku?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          is_admin: boolean;
        } & Timestamps;
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          is_admin?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string | null;
          full_name: string;
          phone: string;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          is_default: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          user_id: string;
          label?: string | null;
          full_name: string;
          phone: string;
          line1: string;
          line2?: string | null;
          city: string;
          state: string;
          postal_code: string;
          country?: string;
          is_default?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          variant_id: string;
          quantity: number;
          updated_at: string;
        } & Timestamps;
        Insert: {
          id?: string;
          user_id: string;
          variant_id: string;
          quantity: number;
        };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_no: number;
          user_id: string;
          status: OrderStatus;
          subtotal: number;
          shipping_fee: number;
          total: number;
          currency: string;
          email: string;
          shipping_address: ShippingAddress;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          updated_at: string;
        } & Timestamps;
        Insert: {
          id?: string;
          user_id: string;
          status?: OrderStatus;
          subtotal: number;
          shipping_fee?: number;
          total: number;
          currency?: string;
          email: string;
          shipping_address: ShippingAddress;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]> & {
          status?: OrderStatus;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name: string;
          size: string;
          unit_price: number;
          quantity: number;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name: string;
          size: string;
          unit_price: number;
          quantity: number;
          image_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      create_order_from_cart: {
        Args: { p_address_id: string; p_email: string };
        Returns: { order_id: string; total: number }[];
      };
      mark_order_paid: {
        Args: { p_order_id: string; p_payment_id: string; p_signature: string };
        Returns: undefined;
      };
    };
    Enums: {
      order_status: OrderStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

// ---- Convenience row aliases -------------------------------------------------
type Tables = Database["public"]["Tables"];
export type Category = Tables["categories"]["Row"];
export type Product = Tables["products"]["Row"];
export type ProductImage = Tables["product_images"]["Row"];
export type ProductVariant = Tables["product_variants"]["Row"];
export type Profile = Tables["profiles"]["Row"];
export type Address = Tables["addresses"]["Row"];
export type CartItem = Tables["cart_items"]["Row"];
export type Order = Tables["orders"]["Row"];
export type OrderItem = Tables["order_items"]["Row"];

// ---- Composed shapes used across the UI -----------------------------------
export type ProductWithRelations = Product & {
  category: Pick<Category, "id" | "slug" | "name">;
  images: ProductImage[];
  variants: ProductVariant[];
};

export type ProductCardData = Product & {
  category: Pick<Category, "slug" | "name">;
  images: Pick<ProductImage, "url" | "alt">[];
  variants: Pick<ProductVariant, "stock_quantity">[];
};

export type CartLine = CartItem & {
  variant: ProductVariant & {
    product: Product & { images: Pick<ProductImage, "url" | "alt">[] };
  };
};

export type OrderWithItems = Order & { items: OrderItem[] };
