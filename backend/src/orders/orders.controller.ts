import { Controller, Get, Post, Param, Body, Query, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @Query('sessionId') sessionId: string,
    @Body()
    body: {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      totalAmount: number;
      items: { productId: number; quantity: number; price: number }[];
    },
  ) {
    if (!body.totalAmount || body.totalAmount <= 0) {
      throw new BadRequestException('totalAmount is required and must be greater than 0');
    }
    if (!Array.isArray(body.items)) {
      throw new BadRequestException('items must be an array');
    }
    if (!body.customerName) {
      throw new BadRequestException('customerName is required');
    }
    if (!body.customerEmail) {
      throw new BadRequestException('customerEmail is required');
    }
    if (!body.customerPhone) {
      throw new BadRequestException('customerPhone is required');
    }

    return this.ordersService.createOrder(
      sessionId,
      body.customerName,
      body.customerEmail,
      body.customerPhone,
      body.totalAmount,
      body.items,
    );
  }

  @Get('history')
  async getOrderHistory(@Query('sessionId') sessionId: string) {
    return this.ordersService.getOrderHistory(sessionId);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrder(parseInt(id, 10));
  }
}
