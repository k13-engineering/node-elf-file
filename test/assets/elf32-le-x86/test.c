#include <stdio.h>

static char data[512];
static volatile int x = 12;
static volatile int y = 16;

int main(int argc, char* argv[]) {
	printf("x = %i\n", x++);
	printf("y = %i\n", y++);
	printf("data[0] = %i\n", data[0]++);
}
