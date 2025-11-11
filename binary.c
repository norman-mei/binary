#include <cs50.h>
#include <stdio.h>

#define NUMBERS 10

bool bin_search(int value, int values[], int min, int max);

int main(void)
{
    int arr[] = {2, 4, 6, 7, 8, 10, 11, 14, 18, 20};

    int target = get_int("Enter a number: ");

    if (bin_search(target, arr, 0, NUMBERS - 1))
    {
        printf("Found!\n");
    }
    else
    {
        printf("Not found!\n");
    }
}

bool bin_search(int value, int values[], int min, int max)
{
    if (min > max)
    {
        return false;
    }

    int middle = (min + max) / 2;

    if (value == values[middle])
    {
        return true;
    }
    else if (value < values[middle])
    {
        return bin_search(value, values, min, middle - 1);
    }
    else
    {
        return bin_search(value, values, middle + 1, max);
    }
}
