import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId)

      const { data: stock } = await api.get<Stock>(`stock/${productId}`)

      const stockAmount = stock.amount;
      const currentAmout = productExists ? productExists.amount : 0;
      const amount = currentAmout + 1

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
      }

      if (productExists) {
        updateProductAmount({ productId, amount })
      } else {
        const { data: product } = await api.get<Product>(`products/${productId}`)

        const item = {
          ...product,
          amount: 1,
        };

        setCart([...cart, item]);

        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify([...cart, item])
        );
      }

    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId)

      if (!productExists) {
        toast.error('Erro na remoção do produto');
        return
      }

      const filtredProducts = cart.filter(product => product.id !== productId)
      setCart(filtredProducts)

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(filtredProducts));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return

      const { data: stock } = await api.get<Stock>(`stock/${productId}`)

      const stockAmount = stock.amount;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const findedProduct = cart.filter(
        (product) => product.id === productId
      );

      if (findedProduct) {
        const updated = cart.filter((product) => {
          if (product.id === productId) product.amount = amount;
          return product;
        });
        setCart(updated);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updated));
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
