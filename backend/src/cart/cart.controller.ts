import { Controller, Get, Post, Delete, Put, Param, Body, Query } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Query('sessionId') sessionId: string) {
    return this.cartService.getCart(sessionId);
  }

  @Get('suggestions')
  async getSuggestions(@Query('sessionId') sessionId: string) {
    return this.cartService.getSuggestions(sessionId);
  }

  @Post('add')
  async addToCart(
    @Query('sessionId') sessionId: string,
    @Body() body: { productId: number; quantity?: number },
  ) {
    return this.cartService.addToCart(
      sessionId,
      body.productId,
      body.quantity || 1,
    );
  }

  @Put('update')
  async updateQuantity(
    @Query('sessionId') sessionId: string,
    @Body() body: { productId: number; quantity: number },
  ) {
    return this.cartService.updateQuantity(
      sessionId,
      body.productId,
      body.quantity,
    );
  }

  @Delete(':productId')
  async removeFromCart(
    @Query('sessionId') sessionId: string,
    @Param('productId') productId: string,
  ) {
    await this.cartService.removeFromCart(sessionId, parseInt(productId, 10));
    return { success: true };
  }

  @Delete()
  async clearCart(@Query('sessionId') sessionId: string) {
    await this.cartService.clearCart(sessionId);
    return { success: true };
  }

  @Get('total')
  async getCartTotal(@Query('sessionId') sessionId: string) {
    const total = await this.cartService.getCartTotal(sessionId);
    return { total };
  }
}
